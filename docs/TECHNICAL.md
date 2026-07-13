# World Cup Aura — Technical Overview

A fan-engagement web app: users take a selfie, answer a short quiz, and get a
generated **Aura Card** (stats, rarity, prophecy, a look-alike footballer) that
they can save, share, **mint as a Solana NFT**, and order as a physical card.

> Deployment/operations live in [`SERVER-DEPLOY.md`](./SERVER-DEPLOY.md).
> **Production runs off the `Bilal` branch.**

## Stack

| Layer | Tech |
|---|---|
| Monorepo | pnpm workspaces, Node 24, TypeScript 5.9 |
| Frontend | React 19 + Vite 7, Tailwind v4, wouter (routing), TanStack Query, framer-motion |
| Backend | Express 5, bundled to a single ESM file with esbuild |
| DB | PostgreSQL (**Neon**, `us-east-1`) via Drizzle ORM |
| API contract | OpenAPI (`lib/api-spec/openapi.yaml`) → Orval codegen → Zod schemas + typed React client |
| Fonts (self-hosted) | Archivo (display), Geist (body), Oswald (condensed) |

## Monorepo layout

```
artifacts/
  api-server/     Express API (esbuild bundle → dist/index.mjs)
  aura-card/      React/Vite frontend (build → dist/public)
lib/
  db/             Drizzle schema + Neon pool  (@workspace/db)
  api-spec/       OpenAPI spec + Orval config
  api-zod/        generated Zod request/response schemas  (@workspace/api-zod)
  api-client-react/ generated typed fetch client  (@workspace/api-client-react)
  integrations-openai-ai-server/  OpenAI client wrapper
scripts/          misc tsx utilities
```

## Request flow

```
Browser ── HTTPS ──▶ nginx (host) ──▶ API container 127.0.0.1:8091 ──┬─▶ Neon Postgres (us-east-1)
             │  static SPA at /                                       ├─▶ OpenAI (portrait gen)
             │  API at /api  (Express router mounted at /api)         ├─▶ Solana devnet (mint / VRF / TxLINE)
             │                                                        └─▶ Ziina (payments)
```

- Server binds `PORT` (container 8080), health at **`/api/healthz`** (pings the DB).
- `app.set("trust proxy", 1)` so client IPs survive the nginx hop (rate limiting).

## Core features & where they live

- **Aura Card generation** — quiz + scoring (`aura-card/src/lib/scoring.ts`), rarity tiers with server-enforced quotas (`rarity_quotas` table).
- **Portrait transform** — selfie → stylized portrait via OpenAI **`gpt-image-1`** (`api-server/src/lib/gptImage.ts`, `quality: "medium"`).
- **Player resemblance** — matches the card's six stats (speed/clutch/iq/chaos/loyalty/banter) to a **curated local dataset of 37 players** (`aura-card/src/lib/players.ts`, `playerMatch.ts`). Self-contained, no external dependency.
- **Community wall** — public cards list, votes, comments (`card_votes`, `card_comments`). List endpoint returns an `imageUrl` path (`/api/aura/card/:slug/image`) instead of embedding base64, keeping the response ~KB not ~MB.
- **Live World Cup ticker** — fixtures from the **TxOdds / TxLINE** feed (see below).
- **Minting** — Solana devnet NFT via a sponsor "treasury" wallet.

## Integrations

| Integration | Purpose | Key files | Config |
|---|---|---|---|
| **OpenAI** | selfie → portrait | `lib/gptImage.ts`, `lib/integrations-openai-ai-server` | `OPENAI_API_KEY` |
| **Solana — mint** | devnet NFT minting, sponsored by treasury wallet | `lib/solanaMint.ts` | `SOLANA_TREASURY_SECRET_KEY`, `SOLANA_DEVNET_RPC_URL` |
| **Solana — VRF** | server-authoritative on-chain verifiable card randomness + verified badge | `lib/solanaVrf.ts` | (uses treasury RPC) |
| **TxOdds / TxLINE** | live World Cup **fixtures** for the ticker; free tier activated via an on-chain Solana subscription | `lib/txline.ts`, `lib/txlineActivate.ts`, `txoracle.idl.json`, `routes/worldcup.ts` | `TXLINE_API_TOKEN` (or on-chain auto-activation), `TXLINE_API_BASE`, `TXLINE_WC_COMPETITION_ID` |
| **Ziina** | payments for physical-card shipping (AED) | `lib/ziina.ts`, `routes/ship.ts` | `ZIINA_API_KEY`, `ZIINA_TEST_MODE` |
| **Analytics** | funnel tracking | `aura-card/src/lib/analytics.ts` | `VITE_GA_MEASUREMENT_ID`, `VITE_FB_PIXEL_ID`, `VITE_POSTHOG_API_KEY` |

**TxLINE note:** with no `TXLINE_API_TOKEN`, the server auto-activates on Solana devnet using the treasury wallet (guest JWT → Token-2022 ATA → `subscribe` on the TxOdds oracle program → `POST /token/activate` → cached token). This requires the **treasury wallet to hold devnet SOL**; without it the ticker fails closed and self-hides.

## Data model (`lib/db/src/schema/index.ts`)

`aura_cards` (slug, card JSON, image_data_url, rarity, vrf_tx_sig) · `rarity_quotas` · `card_votes` · `card_comments` · `ship_orders` (shipping; schema present, DB migration pending).

## API surface (mounted at `/api`)

- `GET /healthz` — readiness (DB ping)
- `POST /aura/card`, `POST /aura/transform` (+ `/transform/start` async variant), `POST /aura/mint`
- `GET /aura/cards` (community list), `GET /aura/card/:slug`, `GET /aura/card/:slug/image`, `PATCH /aura/card/:slug/image`
- `POST /aura/cards/:slug/vote`, `GET|POST /aura/cards/:slug/comments`
- `GET /worldcup/fixtures` (TxLINE), `POST /ship` (Ziina)

## Cross-cutting

- **Rate limiting** — `express-rate-limit`, in-memory, per-IP (IPv6-safe via `ipKeyGenerator`), active in production, tunable via `RATE_LIMIT_*` env vars. In-memory ⇒ **single instance only**.
- **CORS** — allow-list via `CORS_ALLOWED_ORIGINS`.
- **Security headers** — helmet; structured logging via pino (hashed IPs).

## Build & run

```bash
pnpm run typecheck                              # whole workspace
pnpm --filter @workspace/api-server run build   # esbuild → dist/index.mjs
pnpm --filter @workspace/aura-card run build    # vite → dist/public
pnpm --filter @workspace/api-spec run codegen   # regen Zod + client from OpenAPI
```
