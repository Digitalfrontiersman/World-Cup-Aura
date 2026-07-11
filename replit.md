# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` - run the API server (port 5000)
- `pnpm run typecheck` - full typecheck across all packages
- `pnpm run build` - typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` - regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` - push DB schema changes (dev only)
- Required env: `DATABASE_URL` - Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build - short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build - non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

- **World Cup Aura Card** (`artifacts/aura-card`): a fan-card generator. Users take a selfie, answer a short quiz, and get a generated "Aura Card" with stats, rarity, and a prophecy. They can Save, Share, and **Mint the card as a Solana devnet NFT** directly in-app (no external wallet - a throwaway devnet wallet is created/persisted in `localStorage` and auto-funded via the devnet faucet).

## User preferences

_Populate as you build - explicit user instructions worth remembering across sessions._

## Gotchas

- **DOM-to-image capture uses `html2canvas-pro`, not `html2canvas`.** Tailwind v4 emits `oklch()`/`oklab()` colors which plain html2canvas can't parse (throws "unsupported color function oklab"). `html2canvas-pro` is a drop-in replacement.
- **Solana minting needs browser polyfills.** `artifacts/aura-card/vite.config.ts` uses `vite-plugin-node-polyfills`. After changing polyfill config, delete `artifacts/aura-card/node_modules/.vite` and restart the workflow, or stale prebundled deps keep failing with `import_stream.default.Readable is undefined`.
- **Devnet RPC uses Helius.** The mint path routes its `Connection` + Umi through `VITE_SOLANA_DEVNET_RPC_URL` (`resolveDevnetEndpoint()` in `solanaWallet.ts` accepts a full RPC URL or a bare Helius key). The key lives in the gitignored `artifacts/aura-card/.env` (not committed). If unset, the app falls back to the rate-limited public endpoint and logs a dev-only warning. A dev-only console log (`import.meta.env.DEV`) reports the active endpoint with the api-key masked, so a misconfigured key is visible at a glance.
- **Treasury (sponsor) wallet config is env-var-first, file-fallback.** `solanaMint.ts` reads `SOLANA_TREASURY_SECRET_KEY` + `SOLANA_DEVNET_RPC_URL` from env when present, else falls back to the gitignored `artifacts/api-server/.solana-treasury.json` (`rpcUrl` + base58 `secretKey`), else a public devnet RPC. The secret key alone fully restores the wallet - keep it out of git. `loadConfig()` memoizes its result, so after creating/replacing the treasury file you must restart the api-server workflow or it keeps serving the old (often `configured:false`) state.
- **Devnet faucet is flaky and separate from the RPC.** `requestAirdrop` is rate-limited regardless of RPC provider: the Helius faucet caps at **1 SOL per project per day** (403), and the public faucet has its own daily quota (429). `tryAirdrop()` requests from both endpoints to combine quotas; balance reads + mint still go through Helius. `ensureFunded()` throws a distinct `RpcError` vs `FaucetError` so the UI can tell "endpoint unreachable" apart from "no test SOL". The mint flow retries and shows a manual faucet fallback link with the wallet address. `faucet.solana.com` is captcha-gated and cannot be called from code.

## Rate limiting (API Server)

IP-based rate limits protect AI and mint endpoints from bots. Active only in production (`NODE_ENV=production`); disabled in dev. Limits are tunable via env vars - no deploy needed.

| Var | Default | Endpoint |
|---|---|---|
| `RATE_LIMIT_CARD_PER_HOUR` | `5` | `POST /api/aura/card` |
| `RATE_LIMIT_TRANSFORM_PER_15MIN` | `10` | `POST /api/aura/transform` |
| `RATE_LIMIT_MINT_PER_HOUR` | `3` | `POST /api/aura/mint` |

Responses on breach: `429` with `{ error: "..." }` + `X-RateLimit-Remaining` and `Retry-After` headers.
Abuse is logged as a structured `warn` with a hashed (SHA-256, first 16 hex chars) IP - no raw IPs stored.

## Analytics setup

The Aura Card app sends funnel events to GA4 and Facebook Pixel. Both are enabled only when their env vars are set - no tracking fires in dev unless you add the vars.

**Environment variables** (set in Replit Secrets or `artifacts/aura-card/.env`):

| Var | Description |
|---|---|
| `VITE_APP_URL` | Canonical app URL for share links, e.g. `https://worldcupaura.com` - falls back to `window.location.origin` if unset |
| `VITE_GA_MEASUREMENT_ID` | GA4 Measurement ID, e.g. `G-XXXXXXXXXX` |
| `VITE_FB_PIXEL_ID` | Facebook Pixel ID, e.g. `1234567890` |
| `VITE_POSTHOG_API_KEY` | PostHog project API key - found in PostHog → Project Settings → API Keys. Enables session recordings, heatmaps, and funnels. |
| `VITE_POSTHOG_HOST` | PostHog ingest host (optional) - defaults to `https://us.i.posthog.com`. Set to `https://eu.i.posthog.com` for EU data residency, or your self-hosted URL. |

**Funnel events fired (in order):**

| Event name | When |
|---|---|
| `aura_step_landing` | User hits the landing page |
| `aura_step_photo` | User advances to the selfie screen |
| `aura_step_quiz_start` | User reaches the first quiz question |
| `aura_step_quiz_complete` | User answers all 7 questions |
| `aura_step_scanning` | AI generation begins |
| `aura_step_result` | Card is displayed |
| `aura_step_mint_start` | User taps "Mint" |
| `aura_step_mint_success` | Mint confirmed on-chain |

The FB Pixel also fires a standard `Purchase` event on `mint_success` - this is what Meta needs to optimise ad delivery.

**Configuring the GA4 Funnel Exploration report** (no code needed):
1. Open [GA4](https://analytics.google.com) → Explore → Funnel Exploration.
2. Add steps using Event name equals each of the `aura_step_*` names above, in order.
3. GA4 will show you the drop-off rate at each stage across your real user traffic.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
