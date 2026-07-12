import express, { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { transformWithGptImage, isGptImageConfigured } from "../lib/gptImage";
import {
  fetchBlockhashData,
  deriveVrfSeed,
  deriveVrfValues,
  pickRarity,
  commitVrfMemo,
  type VrfValues,
} from "../lib/solanaVrf.js";
import {
  cardRateLimiter,
  transformRateLimiter,
  mintRateLimiter,
  imageUpdateRateLimiter,
  communityRateLimiter,
} from "../middleware/rateLimiter";
import {
  GetMintStatusResponse,
  MintAuraCardBody,
  MintAuraCardResponse,
  SaveAuraCardBody,
  SaveAuraCardResponse,
  GetAuraCardResponse,
  ListAuraCardsResponse,
  GetRarityStatsResponse,
  VoteAuraCardBody,
  VoteAuraCardResponse,
  ListCardCommentsResponse,
  PostCardCommentBody,
  PostCardCommentResponse,
} from "@workspace/api-zod";
import {
  getMintStatusInfo,
  isMintConfigured,
  isValidAddress,
  mintCardToRecipient,
  TreasuryNotConfiguredError,
  TreasuryUnfundedError,
  type CardMeta,
} from "../lib/solanaMint";
import { db } from "@workspace/db";
import { auraCardsTable, rarityQuotasTable, cardVotesTable, cardCommentsTable } from "@workspace/db";
import { eq, desc, sql, count, sum, and } from "drizzle-orm";

const router: IRouter = Router();

// Per-route body parsers. Image-bearing routes accept large JSON (data URLs);
// everything else stays small (the global parser in app.ts is only 64kb, so
// these must be attached explicitly where a bigger body is legitimate).
const jsonLarge = express.json({ limit: "25mb" });
const jsonSmall = express.json({ limit: "64kb" });

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const TRANSFORM_MAX_CONCURRENT = Number(
  process.env.TRANSFORM_MAX_CONCURRENT ?? "5",
);
const TRANSFORM_SERVER_TIMEOUT_MS = Number(
  process.env.TRANSFORM_SERVER_TIMEOUT_MS ?? "120000",
);

let inFlight = 0;

// ---------------------------------------------------------------------------
// Server-authoritative VRF store
// ---------------------------------------------------------------------------
// Populated at portrait-generation time; consumed single-use at save time.
// Entries older than VRF_STORE_TTL_MS are pruned on each new registration.

const VRF_STORE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface VrfStoreEntry {
  vrfVals: VrfValues;
  blockhash: string;
  requestId: string;
  vrfTs: number;
  memoPromise: Promise<string | null>;
  createdAt: number;
}

const vrfStore = new Map<string, VrfStoreEntry>();

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error(`Transform timed out after ${ms}ms`);
        err.name = "AbortError";
        reject(err);
      }, ms);
    }),
  ]).finally(() => clearTimeout(timer!));
}

const MAX_MINT_CONCURRENT = 2;
let mintInFlight = 0;

// ---------------------------------------------------------------------------
// Rarity Framework - 100k Edition Print Run
// ---------------------------------------------------------------------------

export const RARITY_TIERS = [
  { tier: "Core",      quota: 55000, pullRate: 55.0 },
  { tier: "Rising",    quota: 25000, pullRate: 25.0 },
  { tier: "Elite",     quota: 12000, pullRate: 12.0 },
  { tier: "Icon",      quota: 5500,  pullRate: 5.5  },
  { tier: "Legendary", quota: 2000,  pullRate: 2.0  },
  { tier: "Mythic",    quota: 500,   pullRate: 0.5  },
] as const;

export const TOTAL_EDITION_SIZE = 100_000;

export class PrintRunExhaustedError extends Error {
  constructor() {
    super(
      "The 100,000-card print run is complete. No more Aura Cards can be issued.",
    );
    this.name = "PrintRunExhaustedError";
  }
}

let quotasInitialized = false;

/**
 * Runs tracked, idempotent schema migrations. Each migration is recorded in
 * `_schema_migrations` so it only ever runs once, even across restarts.
 *
 * Migrations run inside a single transaction guarded by a PostgreSQL advisory
 * lock so concurrent cold-start requests cannot race on the same migration.
 *
 *   000 - DDL: adds edition_number + rarity columns, creates rarity_quotas
 *   001 - data: backfills rarity for pre-framework cards
 *   002 - data: guarantees every card has a sequential edition number
 */
async function runSchemaMigrations(): Promise<void> {
  // Create the tracking table first - outside the advisory lock because this
  // DDL is truly idempotent and needed before we can acquire the lock.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      key        TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // All remaining migrations run inside a single transaction.
  // pg_advisory_xact_lock ensures only one concurrent request can hold the
  // lock; others wait until this transaction commits, then find the migration
  // keys already present and skip their bodies.
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(7482910356)`);

    // --- Migration 000: DDL ---
    // Adds edition_number (SERIAL NOT NULL UNIQUE) and rarity columns to
    // aura_cards and creates the rarity_quotas table. Uses IF NOT EXISTS / DO
    // blocks to be safe on both fresh DBs and DBs already partially migrated.
    const m000 = await tx.execute(
      sql`SELECT key FROM _schema_migrations WHERE key = '000_schema_ddl'`,
    ) as { rows: unknown[] };

    if (!m000.rows.length) {
      // SERIAL: use a DO block to check column existence before adding;
      // avoids orphaned sequences if the column was already added manually.
      await tx.execute(sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'aura_cards' AND column_name = 'edition_number'
          ) THEN
            ALTER TABLE aura_cards ADD COLUMN edition_number SERIAL;
            ALTER TABLE aura_cards
              ADD CONSTRAINT aura_cards_edition_number_unique UNIQUE (edition_number);
          END IF;
        END $$
      `);

      await tx.execute(sql`
        ALTER TABLE aura_cards
          ADD COLUMN IF NOT EXISTS rarity TEXT NOT NULL DEFAULT 'Core'
      `);

      await tx.execute(sql`
        CREATE TABLE IF NOT EXISTS rarity_quotas (
          tier   TEXT    PRIMARY KEY,
          quota  INTEGER NOT NULL,
          issued INTEGER NOT NULL DEFAULT 0
        )
      `);

      await tx.execute(
        sql`INSERT INTO _schema_migrations (key) VALUES ('000_schema_ddl')`,
      );
    }

    // --- Migration 001: backfill card rarity ---
    // Assigns weighted rarity to every pre-framework row via fixed pull-rate
    // thresholds matching the configured RARITY_TIERS pull rates (55/25/12/5.5/2/0.5%).
    // Updates BOTH the rarity column AND card JSONB so all read paths agree.
    const m001 = await tx.execute(
      sql`SELECT key FROM _schema_migrations WHERE key = '001_backfill_card_rarity'`,
    ) as { rows: unknown[] };

    if (!m001.rows.length) {
      await tx.execute(sql`
        UPDATE aura_cards
        SET
          rarity = assigned.new_rarity,
          card   = card || jsonb_build_object('rarity', assigned.new_rarity)
        FROM (
          SELECT slug,
            CASE
              WHEN rnd < 0.005 THEN 'Mythic'
              WHEN rnd < 0.025 THEN 'Legendary'
              WHEN rnd < 0.080 THEN 'Icon'
              WHEN rnd < 0.200 THEN 'Elite'
              WHEN rnd < 0.450 THEN 'Rising'
              ELSE 'Core'
            END AS new_rarity
          FROM (SELECT slug, random() AS rnd FROM aura_cards) AS rv
        ) AS assigned
        WHERE aura_cards.slug = assigned.slug
      `);

      await tx.execute(
        sql`INSERT INTO _schema_migrations (key) VALUES ('001_backfill_card_rarity')`,
      );
    }

    // --- Migration 002: ensure edition numbers ---
    // Safety-net: assigns nextval() to any row that somehow has a NULL
    // edition_number (e.g. inserts predating the SERIAL column).
    const m002 = await tx.execute(
      sql`SELECT key FROM _schema_migrations WHERE key = '002_ensure_edition_numbers'`,
    ) as { rows: unknown[] };

    if (!m002.rows.length) {
      await tx.execute(sql`
        UPDATE aura_cards
        SET edition_number = nextval('aura_cards_edition_number_seq')
        WHERE edition_number IS NULL
      `);

      await tx.execute(
        sql`INSERT INTO _schema_migrations (key) VALUES ('002_ensure_edition_numbers')`,
      );
    }

    // --- Migration 003: card votes + comments tables ---
    const m003 = await tx.execute(
      sql`SELECT key FROM _schema_migrations WHERE key = '003_card_votes_comments'`,
    ) as { rows: unknown[] };

    if (!m003.rows.length) {
      await tx.execute(sql`
        CREATE TABLE IF NOT EXISTS card_votes (
          id          SERIAL PRIMARY KEY,
          slug        TEXT NOT NULL,
          vote        INTEGER NOT NULL,
          session_id  TEXT NOT NULL,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (slug, session_id)
        )
      `);

      await tx.execute(sql`
        CREATE TABLE IF NOT EXISTS card_comments (
          id           SERIAL PRIMARY KEY,
          slug         TEXT NOT NULL,
          display_name TEXT NOT NULL DEFAULT 'Anonymous',
          body         TEXT NOT NULL,
          created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await tx.execute(sql`
        CREATE INDEX IF NOT EXISTS card_votes_slug_idx ON card_votes(slug)
      `);

      await tx.execute(sql`
        CREATE INDEX IF NOT EXISTS card_comments_slug_idx ON card_comments(slug)
      `);

      await tx.execute(
        sql`INSERT INTO _schema_migrations (key) VALUES ('003_card_votes_comments')`,
      );
    }

    // --- Migration 004: vrf_tx_sig column ---
    // Stores the Solana Memo transaction signature that permanently commits the
    // VRF seed + derived card values on-chain. Surfaced as a "Verified on Solana"
    // badge on the card result and detail pages.
    const m004 = await tx.execute(
      sql`SELECT key FROM _schema_migrations WHERE key = '004_vrf_tx_sig'`,
    ) as { rows: unknown[] };

    if (!m004.rows.length) {
      await tx.execute(sql`
        ALTER TABLE aura_cards ADD COLUMN IF NOT EXISTS vrf_tx_sig TEXT
      `);
      await tx.execute(
        sql`INSERT INTO _schema_migrations (key) VALUES ('004_vrf_tx_sig')`,
      );
    }
  });
}

async function ensureQuotasSeeded(): Promise<void> {
  if (quotasInitialized) return;

  // Run tracked schema migrations first (idempotent)
  await runSchemaMigrations();

  // Upsert quota definitions (idempotent - safe to run on every cold start)
  for (const { tier, quota } of RARITY_TIERS) {
    await db
      .insert(rarityQuotasTable)
      .values({ tier, quota, issued: 0 })
      .onConflictDoNothing();
  }

  // Sync issued counts from actual card rows so quota stats are always
  // accurate - fixes drift from pre-framework inserts or mid-transaction
  // restarts. Runs after the backfill migration so counts reflect the
  // newly-assigned rarities.
  await db.execute(sql`
    UPDATE rarity_quotas rq
    SET issued = (
      SELECT count(*)::int FROM aura_cards ac WHERE ac.rarity = rq.tier
    )
  `);

  quotasInitialized = true;
}

// ---------------------------------------------------------------------------
// Transform helpers
// ---------------------------------------------------------------------------

type TransformBody = {
  image?: string;
  nation?: string;
  archetype?: string;
  energy?: string;
  walkout?: string;
  weapon?: string;
  styleVariant?: "realistic" | "comic" | "fantasy";
  gender?: string;
  auraTier?: string;
};

const STYLE_SUFFIXES: Record<NonNullable<TransformBody["styleVariant"]>, string> = {
  realistic: [
    `Art direction: hyper-realistic photographic render - cinematic IMAX-quality lighting, subsurface skin scattering, physically accurate fabric textures, ultra-sharp 8K detail.`,
    `Dramatic stadium floodlights with volumetric god-rays, lens flare, shallow depth-of-field bokeh background. Photorealistic glowing aura energy around the figure.`,
    `Style: premium sports photography meets concept-art realism. No text or words in the image.`,
  ].join(" "),
  comic: [
    `Art direction: bold dramatic comic-book / graphic-novel illustration - thick confident ink outlines, cel-shaded colour fills, halftone dot textures, high-contrast shadow slabs.`,
    `Dynamic action pose with motion-blur speed lines radiating outward. Explosive aura bursts rendered as comic panel energy effects in vibrant orange and electric blue.`,
    `Style: Marvel / DC collectible variant-cover art meets manga sports drama. No text or words in the image.`,
  ].join(" "),
  fantasy: [
    `Art direction: rich painterly fantasy-epic oil painting - lush impasto brushwork, luminous glazed highlights, classical portrait grandeur elevated to mythic scale.`,
    `Surrounded by swirling arcane aura fire, golden magical particles, and a dramatic twilight-stadium sky with storm clouds parting. Regal, timeless, masterwork quality.`,
    `Style: Renaissance heroic portraiture fused with high-fantasy concept art and World Cup fever. No text or words in the image.`,
  ].join(" "),
};


const TIER_ATMOSPHERE: Record<string, string> = {
  "Street Warrior": `Atmosphere: raw determined energy - chalk dust rising under stadium floodlights, underdog hunger, neon arena shadows, eyes blazing with the drive to prove themselves.`,
  "Rising Star": `Atmosphere: raw determined energy - chalk dust rising under stadium floodlights, underdog hunger, neon arena shadows, eyes blazing with the drive to prove themselves.`,
  "Club Legend": `Atmosphere: stadium floodlights blazing, crowd bokeh stretching behind them, commanding authority - a proven winner radiating medal glow and local-legend status.`,
  "National Hero": `Atmosphere: stadium floodlights blazing, crowd bokeh stretching behind them, commanding authority - a proven winner radiating medal glow and national pride.`,
  "World Class": `Atmosphere: divine golden light rays cutting through smoke, swirling particle storm of pure aura, once-in-a-generation gravitas - a living legend who elevates everyone around them.`,
  "Mythic Champion": `Atmosphere: divine golden light rays cutting through smoke, swirling particle storm of pure aura, god-tier energy, once-in-a-generation gravitas - a mythic figure who transcends the game itself.`,
};

function buildPrompt(b: TransformBody): string {
  const nation = b.nation || "their nation";
  const archetype = b.archetype || "Aura Midfielder";
  const energy = b.energy || "Chaos Mode";
  const walkout = b.walkout || "Final boss energy";
  const weapon = b.weapon || "Pure Aura";

  const tierBlock = b.auraTier && TIER_ATMOSPHERE[b.auraTier] ? TIER_ATMOSPHERE[b.auraTier] : "";

  const base = [
    `Transform the person in this photo into an epic football (soccer) hero character for a collectible trading card.`,
    `Keep their recognizable likeness - same face shape, hairstyle, skin tone and key features.`,
    `They are a "${archetype}" with "${energy}" matchday energy and a "${walkout}" walkout vibe, whose signature strength is ${weapon}.`,
    `Dress them in a sleek, fictional football kit inspired by the colors of ${nation} (do NOT use any real team crests, logos, sponsor names or official badges).`,
    `Heroic head-and-shoulders / upper-body portrait, looking powerful and confident, centered composition, dark dramatic background. High detail, vibrant, screenshot-worthy.`,
    tierBlock,
  ].filter(Boolean).join(" ");

  const styleSuffix = b.styleVariant ? STYLE_SUFFIXES[b.styleVariant] : [
    `Render in a polished, cinematic 3D-animation / hero-poster art style (think premium sports video game cover art crossed with an animated movie poster).`,
    `Surround them with glowing aura energy, sparks and flames, dramatic stadium floodlights, and a sense of explosive power.`,
    `Color palette: deep pitch green, trophy gold, electric blue, with intense rim lighting and holographic glow. No text or words in the image.`,
  ].join(" ");

  return `${base} ${styleSuffix}`;
}

function isContentPolicyError(err: unknown): boolean {
  return (
    err !== null &&
    typeof err === "object" &&
    "status" in err &&
    ((err as { status: number }).status === 400 || (err as { status: number }).status === 422)
  );
}

function buildBasePrompt(b: TransformBody): string {
  const nation = b.nation || "their nation";
  const archetype = b.archetype || "Aura Midfielder";
  const energy = b.energy || "Chaos Mode";
  const walkout = b.walkout || "Final boss energy";
  const weapon = b.weapon || "Pure Aura";

  const base = [
    `Transform the person in this photo into an epic football (soccer) hero character for a collectible trading card.`,
    `Keep their recognizable likeness - same face shape, hairstyle, skin tone and key features.`,
    `They are a "${archetype}" with "${energy}" matchday energy and a "${walkout}" walkout vibe, whose signature strength is ${weapon}.`,
    `Dress them in a sleek, fictional football kit inspired by the colors of ${nation} (do NOT use any real team crests, logos, sponsor names or official badges).`,
    `Heroic head-and-shoulders / upper-body portrait, looking powerful and confident, centered composition, dark dramatic background. High detail, vibrant, screenshot-worthy.`,
  ].join(" ");

  const styleSuffix = b.styleVariant ? STYLE_SUFFIXES[b.styleVariant] : [
    `Render in a polished, cinematic 3D-animation / hero-poster art style (think premium sports video game cover art crossed with an animated movie poster).`,
    `Surround them with glowing aura energy, sparks and flames, dramatic stadium floodlights, and a sense of explosive power.`,
    `Color palette: deep pitch green, trophy gold, electric blue, with intense rim lighting and holographic glow. No text or words in the image.`,
  ].join(" ");

  return `${base} ${styleSuffix}`;
}

const DATA_URL_RE = /^data:image\/(png|jpe?g|webp);base64,(.+)$/;

// Media types we are willing to store and serve back. Anything else (svg+xml,
// html, …) is rejected so a card image can never execute script in a viewer.
const ALLOWED_IMAGE_MEDIA_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const SAVE_CARD_IMAGE_BYTES = 20 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

router.get("/aura/cards", async (req, res): Promise<void> => {
  // Ensure schema + quota seeding has run so editionNumber and rarity columns
  // are guaranteed to exist before we select them.
  await ensureQuotasSeeded();

  // Optional paging for the full-collection gallery. Defaults preserve the
  // original behaviour (50 newest, no offset) so existing callers are unchanged.
  const limit = Math.min(120, Math.max(1, Number.parseInt(String(req.query.limit ?? ""), 10) || 50));
  const offset = Math.max(0, Number.parseInt(String(req.query.offset ?? ""), 10) || 0);

  const [rows, totalResult] = await Promise.all([
    // Use raw SQL to include vrf_tx_sig, which is not in the Drizzle schema
    db.execute(
      sql`SELECT
        ac.slug,
        ac.card,
        (ac.image_data_url IS NOT NULL AND length(ac.image_data_url) > 0) AS has_image,
        ac.edition_number,
        ac.rarity,
        ac.vrf_tx_sig,
        COALESCE((SELECT SUM(v.vote) FROM card_votes v WHERE v.slug = ac.slug), 0) AS vote_score,
        COALESCE((SELECT COUNT(*) FROM card_comments c WHERE c.slug = ac.slug), 0) AS comment_count
      FROM aura_cards ac
      ORDER BY ac.created_at DESC
      LIMIT ${limit} OFFSET ${offset}`,
    ) as unknown as { rows: Array<{ slug: string; card: unknown; has_image: boolean; edition_number: number; rarity: string; vrf_tx_sig: string | null; vote_score: number; comment_count: number }> },
    db.select({ value: count() }).from(auraCardsTable),
  ]);

  const totalIssued = totalResult[0]?.value ?? 0;

  const cards = rows.rows.map((row) => {
    const card = row.card as Record<string, unknown>;
    return {
      slug: row.slug,
      name: String(card.name ?? ""),
      nation: String(card.nation ?? ""),
      rarity: row.rarity,
      archetype: String(card.archetype ?? ""),
      imageUrl: row.has_image ? `/api/aura/card/${row.slug}/image` : null,
      editionNumber: row.edition_number,
      voteScore: Number(row.vote_score),
      commentCount: Number(row.comment_count),
      vrfTxSig: row.vrf_tx_sig ?? null,
    };
  });

  res.json(ListAuraCardsResponse.parse({ cards, totalIssued }));
});

router.post("/aura/card", cardRateLimiter, jsonLarge, async (req, res): Promise<void> => {
  const parsed = SaveAuraCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }
  const { card, imageDataUrl, vrfSlug } = parsed.data;
  if (imageDataUrl.length > SAVE_CARD_IMAGE_BYTES) {
    res.status(413).json({ error: "Image data too large." });
    return;
  }

  await ensureQuotasSeeded();

  // Look up server-authoritative VRF state by the opaque vrfSlug the client
  // echoed back from the transform response. The entry was created server-side
  // at portrait-generation time and is consumed here (single-use) so it
  // cannot be replayed. Client-provided seed bytes are NEVER trusted.
  const vrfEntry = typeof vrfSlug === "string" ? vrfStore.get(vrfSlug) : undefined;
  const slug = vrfEntry ? vrfSlug! : randomUUID();
  if (vrfEntry) vrfStore.delete(vrfSlug!);

  const vrfValues: VrfValues | null = vrfEntry?.vrfVals ?? null;
  const vrfSeedBuffer: Buffer | null = vrfValues ? Buffer.from(vrfValues.vrfSeedHex, "hex") : null;

  // Build enriched card: overwrite archetype, prophecy, and stat deltas with
  // the VRF-derived values so they match what will be committed on-chain.
  const baseCard = card as Record<string, unknown>;
  const enrichedCard: Record<string, unknown> = { ...baseCard };
  if (vrfValues) {
    enrichedCard.archetype = vrfValues.vrfArchetype;
    enrichedCard.prophecy  = vrfValues.vrfProphecy;
    const prevStats = { ...((baseCard.stats ?? {}) as Record<string, number>) };
    const clampStat = (v: number) => Math.max(1, Math.min(99, Math.round(v)));
    for (const [key, delta] of Object.entries(vrfValues.vrfStatDeltas)) {
      prevStats[key] = clampStat((prevStats[key] ?? 60) + delta);
    }
    enrichedCard.stats = prevStats;
  }

  // Pre-compute VRF-based rarity draw (deterministic, before entering the tx).
  // Byte 0 of the seed maps to the same cumulative-rate draw as Math.random()
  // so the on-chain VRF data is sufficient to verify the rarity draw.
  const TOTAL_RATE = RARITY_TIERS.reduce((acc, t) => acc + t.pullRate, 0);
  const vrfRand = vrfSeedBuffer ? (vrfSeedBuffer[0] / 256) * TOTAL_RATE : null;

  let rarity: string;
  let editionNumber: number;

  try {
    // Everything runs in a single transaction: rarity draw + quota increment +
    // card insert are atomic. If the insert fails the quota increment rolls
    // back automatically, so issued counts can never drift from real cards.
    const result = await db.transaction(async (tx) => {
      // Lock all quota rows for this transaction
      const quotas = await tx.execute(
        sql`SELECT tier, quota, issued FROM rarity_quotas FOR UPDATE`,
      ) as { rows: Array<{ tier: string; quota: number; issued: number }> };

      const rows = quotas.rows;
      const totalIssued = rows.reduce((acc, r) => acc + r.issued, 0);

      // Hard cap: reject once the 100k print run is complete
      if (totalIssued >= TOTAL_EDITION_SIZE) {
        throw new PrintRunExhaustedError();
      }

      const quotaMap = new Map(rows.map((r) => [r.tier, r]));

      // Fixed-rate weighted draw: use the configured pull rates (55/25/12/5.5/2/0.5%)
      // so published odds always match actual draw behavior.
      // RARITY_TIERS is ordered most-common → rarest; iterate rarest-first to
      // accumulate cumulative pull rates against a single random number.
      // Use the VRF-derived rand when available; fall back to Math.random().
      const totalRate = RARITY_TIERS.reduce((acc, t) => acc + t.pullRate, 0);
      const rand = vrfRand ?? Math.random() * totalRate;
      let drawnIdx = 0; // default to index 0 (Core, most common)
      let cumRate = 0;
      for (let i = RARITY_TIERS.length - 1; i >= 0; i--) {
        cumRate += RARITY_TIERS[i].pullRate;
        if (rand < cumRate) {
          drawnIdx = i;
          break;
        }
      }

      // Cascade fallback: two-pass search so issuance never fails prematurely.
      //
      // Pass 1 (primary): step from drawnIdx toward Core (more-common). This is
      // the normal fallback path - a drawn Mythic that's exhausted falls to
      // Legendary, then Icon, etc.
      //
      // Pass 2 (recovery): if the primary pass exhausts without finding a slot
      // (e.g. Core itself was drawn AND is exhausted), scan upward toward rarer
      // tiers. This ensures the full 100k run can always be issued regardless of
      // which tier sells out first.
      let selectedTier: string | null = null;

      for (let i = drawnIdx; i >= 0; i--) {
        const q = quotaMap.get(RARITY_TIERS[i].tier);
        if (q && q.issued < q.quota) {
          selectedTier = RARITY_TIERS[i].tier;
          break;
        }
      }

      if (selectedTier === null) {
        // Recovery pass: scan rarer tiers (above drawnIdx)
        for (let i = drawnIdx + 1; i < RARITY_TIERS.length; i++) {
          const q = quotaMap.get(RARITY_TIERS[i].tier);
          if (q && q.issued < q.quota) {
            selectedTier = RARITY_TIERS[i].tier;
            break;
          }
        }
      }

      if (selectedTier === null) {
        throw new PrintRunExhaustedError();
      }

      // Increment issued count for the selected tier
      await tx
        .update(rarityQuotasTable)
        .set({ issued: sql`${rarityQuotasTable.issued} + 1` })
        .where(eq(rarityQuotasTable.tier, selectedTier));

      // Merge server-assigned rarity into card JSONB so card.rarity and the
      // authoritative rarity column always agree - no matter which path reads it.
      const cardWithRarity = {
        ...enrichedCard,
        rarity: selectedTier,
      };

      // Insert card within the same transaction - atomic with quota increment
      const inserted = await tx
        .insert(auraCardsTable)
        .values({ slug, card: cardWithRarity, imageDataUrl, rarity: selectedTier })
        .returning({ editionNumber: auraCardsTable.editionNumber });

      return {
        rarity: selectedTier,
        editionNumber: inserted[0]!.editionNumber,
      };
    });

    rarity = result.rarity;
    editionNumber = result.editionNumber;
  } catch (err) {
    if (err instanceof PrintRunExhaustedError) {
      res.status(503).json({ error: err.message });
      return;
    }
    throw err;
  }

  // Resolve the Memo promise that was fired non-blocking at portrait-generation time.
  // Allow up to 5 s - the portrait generation + rarity reveal gives ample headroom.
  let vrfTxSig: string | null = null;
  if (vrfEntry) {
    vrfTxSig = await Promise.race([
      vrfEntry.memoPromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
    if (vrfTxSig) {
      await db.execute(
        sql`UPDATE aura_cards SET vrf_tx_sig = ${vrfTxSig} WHERE slug = ${slug}`,
      );
    }
  }

  res.json(SaveAuraCardResponse.parse({ slug, rarity, editionNumber, vrfTxSig }));
});

// NOTE: this route has no ownership check - there is no user/session model yet,
// so anyone who knows a (publicly-listed) slug can replace its image. It is
// rate-limited to blunt abuse; real fix is per-owner auth (tracked for later).
router.patch(
  "/aura/card/:slug/image",
  imageUpdateRateLimiter,
  jsonLarge,
  async (req, res): Promise<void> => {
  const slug = req.params.slug as string;
  const { imageDataUrl } = req.body as { imageDataUrl?: unknown };

  // Only raster image data URLs. Crucially this REJECTS `data:image/svg+xml`,
  // which could carry script and be served back same-origin (stored XSS).
  if (typeof imageDataUrl !== "string" || !DATA_URL_RE.test(imageDataUrl)) {
    res.status(400).json({ error: "imageDataUrl must be a PNG, JPEG, or WebP data URL." });
    return;
  }
  if (imageDataUrl.length > SAVE_CARD_IMAGE_BYTES) {
    res.status(413).json({ error: "Image data too large." });
    return;
  }

  const updated = await db
    .update(auraCardsTable)
    .set({ imageDataUrl })
    .where(eq(auraCardsTable.slug, slug))
    .returning({ slug: auraCardsTable.slug });

  if (updated.length === 0) {
    res.status(404).json({ error: "Card not found." });
    return;
  }

  res.json({ ok: true });
});

router.get("/aura/card/:slug/image", async (req, res): Promise<void> => {
  const { slug } = req.params;
  const rows = await db
    .select({ imageDataUrl: auraCardsTable.imageDataUrl })
    .from(auraCardsTable)
    .where(eq(auraCardsTable.slug, slug))
    .limit(1);
  if (rows.length === 0 || !rows[0].imageDataUrl) {
    res.status(404).json({ error: "Image not found." });
    return;
  }
  const dataUrl = rows[0].imageDataUrl;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) {
    res.status(500).json({ error: "Invalid image data." });
    return;
  }
  const mediaType = match[1];
  // Only ever serve known-safe raster types, never e.g. image/svg+xml or
  // text/html that could execute in the browser. nosniff stops MIME sniffing.
  if (!ALLOWED_IMAGE_MEDIA_TYPES.has(mediaType)) {
    res.status(415).json({ error: "Unsupported image type." });
    return;
  }
  const imageBuffer = Buffer.from(match[2], "base64");
  res.setHeader("Content-Type", mediaType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.send(imageBuffer);
});

router.get("/aura/card/:slug", async (req, res): Promise<void> => {
  const { slug } = req.params;
  // Use raw SQL to include vrf_tx_sig, which is not in the Drizzle schema
  const result = await db.execute(
    sql`SELECT card, image_data_url, vrf_tx_sig FROM aura_cards WHERE slug = ${slug} LIMIT 1`,
  ) as { rows: Array<{ card: unknown; image_data_url: string | null; vrf_tx_sig: string | null }> };
  if (!result.rows.length) {
    res.status(404).json({ error: "Card not found." });
    return;
  }
  const row = result.rows[0];
  res.json(GetAuraCardResponse.parse({
    card: row.card,
    imageDataUrl: row.image_data_url,
    vrfTxSig: row.vrf_tx_sig ?? null,
  }));
});

router.get("/aura/rarity-stats", async (_req, res): Promise<void> => {
  await ensureQuotasSeeded();

  const quotas = await db.select().from(rarityQuotasTable);

  const tierOrder = RARITY_TIERS.map((t) => t.tier);
  const sorted = [...quotas].sort(
    (a, b) => tierOrder.indexOf(a.tier as (typeof tierOrder)[number]) - tierOrder.indexOf(b.tier as (typeof tierOrder)[number]),
  );

  const tiers = sorted.map((row) => ({
    tier: row.tier,
    quota: row.quota,
    issued: row.issued,
    remaining: Math.max(0, row.quota - row.issued),
    pullRate:
      RARITY_TIERS.find((t) => t.tier === row.tier)?.pullRate ?? 0,
  }));

  const totalIssued = tiers.reduce((acc, t) => acc + t.issued, 0);

  res.json(
    GetRarityStatsResponse.parse({ tiers, totalIssued, totalQuota: TOTAL_EDITION_SIZE }),
  );
});

// Cap every free-text field that gets interpolated into the AI prompt. This
// bounds prompt-cost abuse and limits prompt-injection surface - these values
// are attacker-controlled and flow straight into buildPrompt().
const MAX_PROMPT_FIELD = 120;
function capField(v: unknown): string | undefined {
  return typeof v === "string" ? v.slice(0, MAX_PROMPT_FIELD) : undefined;
}

router.post("/aura/transform", transformRateLimiter, jsonLarge, async (req, res) => {
  const raw = req.body as TransformBody;

  if (!raw?.image || typeof raw.image !== "string") {
    res.status(400).json({ error: "Missing 'image' (image data URL)." });
    return;
  }

  // Sanitized view used everywhere below (never trust raw text lengths/types).
  // `satisfies` keeps image narrowed to string (guarded above) while checking
  // the shape against TransformBody.
  const body = {
    image: raw.image,
    nation: capField(raw.nation),
    archetype: capField(raw.archetype),
    energy: capField(raw.energy),
    walkout: capField(raw.walkout),
    weapon: capField(raw.weapon),
    styleVariant: raw.styleVariant,
    auraTier: capField(raw.auraTier),
  } satisfies TransformBody;

  const match = DATA_URL_RE.exec(body.image.trim());
  if (!match) {
    res.status(400).json({ error: "Image must be a PNG, JPEG, or WebP data URL." });
    return;
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(match[2], "base64");
  } catch {
    res.status(400).json({ error: "Invalid base64 image data." });
    return;
  }

  if (buffer.length === 0) {
    res.status(400).json({ error: "Empty image." });
    return;
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    res.status(413).json({ error: "Image too large (max 8MB)." });
    return;
  }

  const requestId = randomUUID();
  const startMs = Date.now();
  const attempt = 1;

  const VALID_STYLE_VARIANTS = new Set(["realistic", "comic", "fantasy"]);
  if (body.styleVariant !== undefined && !VALID_STYLE_VARIANTS.has(body.styleVariant)) {
    res.status(400).json({ error: "Invalid styleVariant. Must be one of: realistic, comic, fantasy." });
    return;
  }

  if (!isGptImageConfigured()) {
    req.log.error(
      { event: "transform_failed", reason: "not_configured" },
      "Portrait generation rejected: OpenAI integration not configured",
    );
    res.status(503).json({ error: "Portrait generation is not configured on the server." });
    return;
  }

  if (inFlight >= TRANSFORM_MAX_CONCURRENT) {
    req.log.warn(
      {
        event: "transform_failed",
        reason: "capacity_rejected",
        attempt,
        elapsed_ms: Date.now() - startMs,
        inFlight,
        limit: TRANSFORM_MAX_CONCURRENT,
      },
      "Portrait generation rejected: at capacity",
    );
    res
      .status(429)
      .json({ error: "Too many requests in progress. Try again shortly.", reason: "capacity_rejected" });
    return;
  }

  inFlight += 1;
  const vrfTs = startMs;

  // Generate card slug and kick off the full VRF pipeline immediately - runs in
  // parallel with the ~60 s portrait generation.
  //
  // Seed = SHA-256("${blockhash}:${cardSlug}:${ts}") so the slug is part of the
  // on-chain verifiable commitment. Blockhash fetch: ~100 ms; memo tx fires and
  // begins confirming long before the image call returns.
  const vrfCardSlug = randomUUID();

  interface VrfPipeline {
    vrfVals: VrfValues;
    blockhash: string;
    memoPromise: Promise<string | null>;
  }

  const vrfPipelinePromise: Promise<VrfPipeline | null> = fetchBlockhashData()
    .then((blockData) => {
      if (!blockData) return null;
      const seedBuf = deriveVrfSeed(blockData.blockhash, vrfCardSlug, vrfTs);
      const vrfVals = deriveVrfValues(seedBuf, blockData.slot);
      // Fire memo non-blocking - will be awaited (up to 5 s) in the save route
      const memoPromise: Promise<string | null> = commitVrfMemo(
        vrfCardSlug,
        blockData.blockhash,
        vrfTs,
        blockData.slot,
        vrfVals.vrfSeedHex,
        pickRarity(seedBuf),
        vrfVals.vrfArchetype,
      ).catch(() => null);
      return { vrfVals, blockhash: blockData.blockhash, memoPromise };
    })
    .catch(() => null);

  try {
    const prompt = buildPrompt(body);
    let imageBuffer: Buffer;
    try {
      imageBuffer = await withTimeout(
        transformWithGptImage(body.image, prompt),
        TRANSFORM_SERVER_TIMEOUT_MS,
      );
    } catch (firstErr) {
      if (isContentPolicyError(firstErr)) {
        req.log.warn(
          { event: "transform_content_policy_fallback", attempt: 1 },
          "Portrait prompt rejected by content policy - retrying with base prompt",
        );
        const fallbackPrompt = buildBasePrompt(body);
        imageBuffer = await withTimeout(
          transformWithGptImage(body.image, fallbackPrompt),
          TRANSFORM_SERVER_TIMEOUT_MS,
        );
      } else {
        throw firstErr;
      }
    }
    // VRF pipeline completed long before portrait - register in store and return full payload
    const vrfPipeline = await vrfPipelinePromise;
    if (vrfPipeline) {
      const now = Date.now();
      for (const [k, v] of vrfStore) {
        if (now - v.createdAt > VRF_STORE_TTL_MS) vrfStore.delete(k);
      }
      vrfStore.set(vrfCardSlug, {
        vrfVals: vrfPipeline.vrfVals,
        blockhash: vrfPipeline.blockhash,
        requestId,
        vrfTs,
        memoPromise: vrfPipeline.memoPromise,
        createdAt: now,
      });
    }
    res.json({
      image: `data:image/png;base64,${imageBuffer.toString("base64")}`,
      ...(vrfPipeline
        ? {
            vrfSlug: vrfCardSlug,
            vrfSeedHex: vrfPipeline.vrfVals.vrfSeedHex,
            vrfSlot: vrfPipeline.vrfVals.vrfSlot,
            vrfArchetype: vrfPipeline.vrfVals.vrfArchetype,
            vrfProphecy: vrfPipeline.vrfVals.vrfProphecy,
            vrfStatDeltas: vrfPipeline.vrfVals.vrfStatDeltas,
          }
        : {}),
    });
  } catch (err) {
    const elapsed_ms = Date.now() - startMs;

    type FailureReason =
      | "capacity_rejected"
      | "not_configured"
      | "content_policy"
      | "openai_error"
      | "upstream_502"
      | "timeout"
      | "unknown";
    let reason: FailureReason;

    if (err instanceof Error && err.name === "AbortError") {
      reason = "timeout";
    } else if (
      err !== null &&
      typeof err === "object" &&
      "status" in err
    ) {
      const apiErr = err as { status: number };
      if (apiErr.status === 400 || apiErr.status === 422) {
        reason = "content_policy";
      } else if (apiErr.status === 502) {
        reason = "upstream_502";
      } else {
        reason = "openai_error";
      }
    } else {
      reason = "unknown";
    }

    req.log.warn(
      { event: "transform_failed", reason, attempt, elapsed_ms },
      "Portrait generation failed",
    );
    res.status(502).json({ error: "Image transformation failed." });
  } finally {
    inFlight -= 1;
  }
});

router.get("/aura/mint-status", async (_req, res): Promise<void> => {
  const info = await getMintStatusInfo();
  res.json(GetMintStatusResponse.parse(info));
});

router.post("/aura/mint", mintRateLimiter, jsonLarge, async (req, res): Promise<void> => {
  const parsed = MintAuraCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }

  if (!isMintConfigured()) {
    res
      .status(503)
      .json({ error: "Minting is not configured on the server yet." });
    return;
  }

  const { image, recipient, card } = parsed.data;

  if (!isValidAddress(recipient)) {
    res.status(400).json({ error: "Invalid recipient wallet address." });
    return;
  }

  const match = DATA_URL_RE.exec(image.trim());
  if (!match) {
    res
      .status(400)
      .json({ error: "Image must be a PNG, JPEG, or WebP data URL." });
    return;
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(match[2], "base64");
  } catch {
    res.status(400).json({ error: "Invalid base64 image data." });
    return;
  }
  if (buffer.length === 0) {
    res.status(400).json({ error: "Empty image." });
    return;
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    res.status(413).json({ error: "Image too large (max 8MB)." });
    return;
  }

  if (mintInFlight >= MAX_MINT_CONCURRENT) {
    res
      .status(429)
      .json({ error: "Too many mints in progress. Try again shortly." });
    return;
  }

  mintInFlight += 1;
  try {
    const result = await mintCardToRecipient(
      new Uint8Array(buffer),
      card as CardMeta,
      recipient,
    );
    res.json(MintAuraCardResponse.parse(result));
  } catch (err) {
    if (err instanceof TreasuryNotConfiguredError) {
      res
        .status(503)
        .json({ error: "Minting is not configured on the server yet." });
      return;
    }
    if (err instanceof TreasuryUnfundedError) {
      res.status(503).json({
        error:
          "The mint sponsor wallet is out of devnet SOL. Please try again later.",
      });
      return;
    }
    req.log.error({ err }, "Aura mint failed");
    res.status(502).json({ error: "Minting failed. Please try again." });
  } finally {
    mintInFlight -= 1;
  }
});

// ---------------------------------------------------------------------------
// Votes
// ---------------------------------------------------------------------------

router.post("/aura/cards/:slug/vote", communityRateLimiter, jsonSmall, async (req, res): Promise<void> => {
  await ensureQuotasSeeded();
  const slug = req.params.slug as string;
  const parsed = VoteAuraCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }
  const { vote, sessionId } = parsed.data;
  if (vote !== 1 && vote !== -1) {
    res.status(400).json({ error: "vote must be 1 or -1." });
    return;
  }

  const card = await db
    .select({ slug: auraCardsTable.slug })
    .from(auraCardsTable)
    .where(eq(auraCardsTable.slug, slug))
    .limit(1);
  if (!card.length) {
    res.status(404).json({ error: "Card not found." });
    return;
  }

  await db
    .insert(cardVotesTable)
    .values({ slug, vote, sessionId })
    .onConflictDoUpdate({
      target: [cardVotesTable.slug, cardVotesTable.sessionId],
      set: { vote },
    });

  const scoreResult = await db
    .select({ total: sql<number>`coalesce(sum(vote), 0)` })
    .from(cardVotesTable)
    .where(eq(cardVotesTable.slug, slug));

  const voteScore = Number(scoreResult[0]?.total ?? 0);
  res.json(VoteAuraCardResponse.parse({ voteScore, userVote: vote }));
});

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

router.get("/aura/cards/:slug/comments", async (req, res): Promise<void> => {
  await ensureQuotasSeeded();
  const { slug } = req.params;

  const card = await db
    .select({ slug: auraCardsTable.slug })
    .from(auraCardsTable)
    .where(eq(auraCardsTable.slug, slug))
    .limit(1);
  if (!card.length) {
    res.status(404).json({ error: "Card not found." });
    return;
  }

  const rows = await db
    .select()
    .from(cardCommentsTable)
    .where(eq(cardCommentsTable.slug, slug))
    .orderBy(desc(cardCommentsTable.createdAt));

  const comments = rows.map((c) => ({
    id: c.id,
    displayName: c.displayName,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
  }));

  res.json(ListCardCommentsResponse.parse({ comments }));
});

router.post("/aura/cards/:slug/comments", communityRateLimiter, jsonSmall, async (req, res): Promise<void> => {
  await ensureQuotasSeeded();
  const slug = req.params.slug as string;
  const parsed = PostCardCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }

  const card = await db
    .select({ slug: auraCardsTable.slug })
    .from(auraCardsTable)
    .where(eq(auraCardsTable.slug, slug))
    .limit(1);
  if (!card.length) {
    res.status(404).json({ error: "Card not found." });
    return;
  }

  const { displayName, body } = parsed.data;
  const inserted = await db
    .insert(cardCommentsTable)
    .values({
      slug,
      displayName: displayName?.trim() || "Anonymous",
      body: body.trim(),
    })
    .returning();

  const c = inserted[0]!;
  res.json(
    PostCardCommentResponse.parse({
      id: c.id,
      displayName: c.displayName,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    }),
  );
});

export default router;
