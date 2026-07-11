import { logger } from "./lib/logger";

// PORT defaults for local dev; Replit/production inject it. Validate an explicit
// bad value loudly.
const port = Number(process.env.PORT) || 5000;
if (Number.isNaN(port) || port <= 0) {
  logger.error({ port: process.env.PORT }, "Invalid PORT value");
  process.exit(1);
}

// Fail LOUD on missing config instead of booting green and 500ing every data
// route. Checked BEFORE importing ./app, because that pulls in @workspace/db
// which throws a raw error at import time when DATABASE_URL is unset.
if (!process.env.DATABASE_URL) {
  logger.error(
    "DATABASE_URL is not set. The API cannot serve any data routes - refusing to start.",
  );
  process.exit(1);
}

// Process-level safety nets. An unhandled rejection is logged (not fatal); an
// uncaught exception is logged and we exit so a supervisor can restart cleanly.
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception - exiting");
  process.exit(1);
});

async function start(): Promise<void> {
  const { db } = await import("@workspace/db");
  const { sql } = await import("drizzle-orm");

  // Verify the database is actually reachable (a well-formed but wrong URL builds
  // a Pool fine and only fails on first query). Fail loud here instead.
  try {
    await db.execute(sql`SELECT 1`);
    logger.info("Database connection OK");
  } catch (err) {
    logger.error(
      { err },
      "Cannot reach the database (check DATABASE_URL) - refusing to start.",
    );
    process.exit(1);
  }

  const { default: app } = await import("./app");
  const { isMintConfigured } = await import("./lib/solanaMint");
  const { isGptImageConfigured } = await import("./lib/gptImage");

  // One-line summary so misconfiguration is obvious at boot rather than on first
  // request to a feature that silently 503s.
  logger.info(
    {
      database: true,
      openai_transform: isGptImageConfigured(),
      solana_minting: isMintConfigured(),
    },
    "Integration configuration at boot",
  );

  const server = app.listen(port, () => {
    logger.info({ port }, "Server listening");
  });

  // listen() failures (e.g. EADDRINUSE) surface as an 'error' EVENT, not via the
  // callback - the previous `app.listen(port, err => …)` never caught them.
  server.on("error", (err) => {
    logger.error({ err }, "HTTP server error (failed to bind port?) - exiting");
    process.exit(1);
  });

  // Graceful shutdown: stop accepting connections, let in-flight requests drain,
  // then exit. Force-exit if draining takes too long.
  const shutdown = (signal: string): void => {
    logger.info({ signal }, "Shutting down gracefully");
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
    setTimeout(() => {
      logger.error("Could not close connections in time - forcing shutdown");
      process.exit(1);
    }, 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

void start();
