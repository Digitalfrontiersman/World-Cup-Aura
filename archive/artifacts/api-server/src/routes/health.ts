import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// Readiness check: actually pings the database so orchestrators / uptime probes
// see "degraded" when the DB is unreachable, instead of a green "ok" while every
// real route 500s.
router.get("/healthz", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json(HealthCheckResponse.parse({ status: "ok" }));
  } catch (err) {
    _req.log?.error({ err }, "Healthcheck failed: database unreachable");
    res.status(503).json({ status: "degraded", error: "database unreachable" });
  }
});

export default router;
