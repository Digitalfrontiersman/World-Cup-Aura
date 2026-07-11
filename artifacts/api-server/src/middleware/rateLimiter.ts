import { rateLimit, type RateLimitRequestHandler } from "express-rate-limit";
import { createHash } from "node:crypto";
import { logger } from "../lib/logger";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

// Fail CLOSED: rate limiting is ON unless explicitly disabled. Previously this
// keyed off `NODE_ENV !== "production"`, which failed OPEN — a missing or
// misspelled NODE_ENV in a real deployment silently turned ALL limits off. For
// local development, set RATE_LIMIT_DISABLED=true (see .env.example).
const rateLimitDisabled = process.env.RATE_LIMIT_DISABLED === "true";

function parseLimit(envVar: string | undefined, defaultVal: number): number {
  const parsed = parseInt(envVar ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultVal;
}

function makeLimiter(opts: {
  max: number;
  windowMs: number;
  endpoint: string;
  message: string;
}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: true,
    keyGenerator: (req) => req.ip ?? "unknown",
    handler: (req, res) => {
      logger.warn({
        event: "rate_limit_exceeded",
        ip_hash: hashIp(req.ip ?? "unknown"),
        endpoint: opts.endpoint,
        timestamp: new Date().toISOString(),
      }, `Rate limit hit on ${opts.endpoint}`);

      res.status(429).json({ error: opts.message });
    },
    skip: () => rateLimitDisabled,
  });
}

export const cardRateLimiter = makeLimiter({
  max: parseLimit(process.env.RATE_LIMIT_CARD_PER_HOUR, 5),
  windowMs: 60 * 60 * 1000,
  endpoint: "POST /api/aura/card",
  message: "Too many cards generated from this IP. Try again later.",
});

export const transformRateLimiter = makeLimiter({
  max: parseLimit(process.env.RATE_LIMIT_TRANSFORM_PER_15MIN, 10),
  windowMs: 15 * 60 * 1000,
  endpoint: "POST /api/aura/transform",
  message: "Remix limit reached. Take a breather and try again soon.",
});

export const mintRateLimiter = makeLimiter({
  max: parseLimit(process.env.RATE_LIMIT_MINT_PER_HOUR, 3),
  windowMs: 60 * 60 * 1000,
  endpoint: "POST /api/aura/mint",
  message: "Too many mint requests from this IP. Please try again later.",
});

// Overwriting a card's image is unauthenticated (no user model yet), so cap it
// per-IP to blunt bulk-overwrite abuse until ownership auth exists.
export const imageUpdateRateLimiter = makeLimiter({
  max: parseLimit(process.env.RATE_LIMIT_IMAGE_PER_HOUR, 30),
  windowMs: 60 * 60 * 1000,
  endpoint: "PATCH /api/aura/card/:slug/image",
  message: "Too many image updates from this IP. Please try again later.",
});

// Votes + comments: prevent spam floods.
export const communityRateLimiter = makeLimiter({
  max: parseLimit(process.env.RATE_LIMIT_COMMUNITY_PER_15MIN, 60),
  windowMs: 15 * 60 * 1000,
  endpoint: "POST /api/aura/cards/:slug/(vote|comments)",
  message: "You're doing that too fast. Please slow down.",
});
