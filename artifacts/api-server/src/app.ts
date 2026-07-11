import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Security headers. CSP is disabled here because this process serves only the
// JSON/image API (the frontend is served separately); `nosniff`, frameguard,
// and friends still apply. crossOriginResourcePolicy is relaxed so card images
// can be embedded by the frontend on another origin.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS allow-list. These endpoints spend treasury SOL and paid AI credits, so in
// production only explicitly-configured origins may call them. Set
// CORS_ALLOWED_ORIGINS to a comma-separated list (e.g. "https://worldcupaura.com").
// When unset (local dev), any localhost/127.0.0.1 origin is allowed for
// convenience; requests with no Origin header (same-origin, curl) always pass.
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (allowedOrigins.length === 0 && LOCALHOST_RE.test(origin)) {
      return cb(null, true);
    }
    return cb(new Error("Not allowed by CORS"));
  },
};
app.use(cors(corsOptions));

// Global body limit is intentionally small: image-heavy routes attach their own
// larger express.json() parser (see routes/aura.ts), so a large JSON payload
// can't be used to DoS the lightweight endpoints (votes, comments, health).
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb" }));

app.use("/api", router);

// Global error handler - one consistent JSON envelope + structured logging.
// Must be registered last and declare four parameters so Express treats it as
// an error handler.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const e = err as { message?: string; type?: string } | null;

  if (e?.message === "Not allowed by CORS") {
    res.status(403).json({ error: "Origin not allowed." });
    return;
  }
  if (e?.type === "entity.too.large") {
    res.status(413).json({ error: "Request body too large." });
    return;
  }

  req.log?.error({ err }, "Unhandled route error");
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal server error." });
});

export default app;
