# World Cup Aura Card

A fan-card generator: users take a selfie, answer a short quiz, and get a generated
**Aura Card** with stats, rarity, and a prophecy - then **mint it as a Solana devnet
NFT** in-app (no external wallet; a throwaway devnet wallet is created in
`localStorage` and the mint is sponsored by a server-side treasury).

The card also carries a **live market read** from real **TxOdds / TxLINE** World Cup
data: the betting market's win-probability for your nation drives an "aura stance"
(Frontrunner / Contender / Dark Horse) on the card. The rarity roll is **verifiable
on Solana** (slot-hash VRF), and the TxLINE feed itself is **activated via an on-chain
Solana subscription** - the wallet proves entitlement, no shared API key.

This is a **pnpm workspace monorepo**. It originated on Replit; this README covers
running it **locally**. For Replit/deployment specifics see [`replit.md`](./replit.md).

## Stack

- pnpm workspaces, Node.js 22+ (24 on Replit), TypeScript 5.9
- **Frontend** (`artifacts/aura-card`): React 19 + Vite 7 + Tailwind v4
- **API** (`artifacts/api-server`): Express 5, esbuild bundle
- **DB**: PostgreSQL 16 + Drizzle ORM (`lib/db`)
- **API contract**: OpenAPI spec (`lib/api-spec`) → generated Zod schemas (`lib/api-zod`) + React Query hooks (`lib/api-client-react`) via Orval
- **AI images**: OpenAI (`lib/integrations-openai-ai-server`)
- **Chain**: Solana devnet (`@solana/web3.js` + Metaplex Umi) - VRF-verifiable rarity + sponsored minting
- **Live data**: TxOdds / TxLINE World Cup feed - fixtures + StablePrice odds, activated via an on-chain Solana subscription (`artifacts/api-server/src/lib/txline.ts`, `txlineActivate.ts`)

## Repo layout

| Path | What |
|---|---|
| `artifacts/aura-card` | The main app (frontend) |
| `artifacts/api-server` | REST API: card gen, AI transform, mint, community, TxLINE feed |
| `lib/*` | Shared libraries (db, api spec/zod/client, OpenAI integration) |
| `scripts` | Workspace tooling |

## Prerequisites

- **Node.js 22+** and **pnpm 10** (`corepack enable` or install pnpm directly)
- **PostgreSQL 16** running locally (or a connection string to one)
- Optional for full features: an **OpenAI API key** (AI portrait transform) and a
  funded **Solana devnet** treasury (minting)

## 1. Install

```bash
pnpm install
```

> The repo enforces pnpm (an npm/yarn install is rejected by a `preinstall` hook).

## 2. Configure the API server

Copy the example env and fill in what you need:

```bash
cp artifacts/api-server/.env.example artifacts/api-server/.env
```

| Var | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | **Yes** | e.g. `postgres://user:password@localhost:5432/aura` |
| `PORT` | for local run | Use `5000` - the frontend dev proxy targets this |
| `OPENAI_API_KEY` | For AI transform | Without it, `/api/aura/transform` returns a graceful 503 |
| `SOLANA_TREASURY_SECRET_KEY` | For minting | base58 secret. **Prefer** the gitignored `artifacts/api-server/.solana-treasury.json` file (`{ "rpcUrl", "secretKey" }`) - never commit a key |
| `SOLANA_DEVNET_RPC_URL` | Optional | Defaults to the public devnet RPC |
| `TXLINE_API_TOKEN` | For live ticker/odds | TxOdds/TxLINE World Cup token. If unset, the server **auto-activates on-chain** using the treasury wallet (needs devnet SOL) |
| `RATE_LIMIT_*` | Optional | Prod-only tuning; see `.env.example` |

> **Security:** a treasury private key must never live in a tracked file. Locally it
> belongs in `.env` or the gitignored `.solana-treasury.json`; on Replit, in Secrets.

## 3. Set up the database

With `DATABASE_URL` exported (or in the api-server `.env`), push the schema:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/aura \
  pnpm --filter @workspace/db run push
```

This creates the `aura_cards`, `rarity_quotas`, `card_votes`, and `card_comments` tables.

## 4. Run locally (two processes)

**Terminal A - API server** (needs `DATABASE_URL` + `PORT`):

```bash
cd artifacts/api-server
PORT=5000 DATABASE_URL=postgres://user:password@localhost:5432/aura pnpm run dev
```

**Terminal B - frontend**:

```bash
cd artifacts/aura-card
pnpm run dev
```

Open **http://localhost:5173/**. The Vite dev server proxies `/api/*` to the API
server on port 5000 (override with `VITE_API_PROXY_TARGET`).

Optional frontend env (analytics, share URL, custom RPC) goes in
`artifacts/aura-card/.env` - see the Analytics section of [`replit.md`](./replit.md).

## Common commands

```bash
pnpm run typecheck    # type-check every package
pnpm run build        # typecheck + build all apps (no env vars needed)
pnpm --filter @workspace/api-spec run codegen   # regenerate API hooks + Zod from the OpenAPI spec
pnpm --filter @workspace/db run push            # push DB schema (dev)
```

## Notes for Windows / Git Bash

- `PORT` and `BASE_PATH` now **default** in the Vite configs, so no env juggling is
  needed for `dev`/`build`. (On Replit these are injected automatically.)
- If you ever pass `BASE_PATH=/` explicitly in Git Bash, prefix the command with
  `MSYS_NO_PATHCONV=1` or Git Bash rewrites `/` into a Windows path.
