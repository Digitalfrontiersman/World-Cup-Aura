# World Cup Aura

Turn a selfie into a collectible World Cup **Aura Card** — stats, rarity, and a
prophecy — then mint it as a Solana devnet NFT. Odds and fixtures come from live
**TxOdds / TxLINE** World Cup data, and the rarity roll is verifiable on-chain.

## Repo layout

The repo was reorganized to keep the root clean while the frontend is rebuilt.

| Path | What |
|---|---|
| **[`web/`](./web)** | **The app.** A clean, self-contained frontend rebuild (React + Vite). Everything it needs lives inside this folder. Start here. |
| [`docs/`](./docs) | Project docs — deploy, technical notes, submission, TxLINE feedback, Replit specifics. |
| [`archive/`](./archive) | The **original monorepo**, moved here as-is: the old frontend (`artifacts/aura-card`), the backend (`artifacts/api-server`), shared libs (`lib/*`), scripts, and all its build/deploy config (`package.json`, `pnpm-workspace.yaml`, `.replit`, …). Self-contained — `cd archive` to build or run it. |

## Run the app

```bash
cd web
pnpm install        # standalone — its own lockfile; not tied to archive/
pnpm dev            # → http://localhost:5173
```

The app calls the backend over `/api/*`. To exercise the full flow (AI transform,
save, mint) also run the API server from the archived monorepo:

```bash
cd archive/artifacts/api-server
PORT=5000 DATABASE_URL=postgres://user:pass@localhost:5432/aura pnpm run dev
```

`/docs` and the landing UI work without the backend; anything hitting the API
(transform, save, mint, community wall) needs it running. See
[`web/README.md`](./web/README.md) for the full frontend guide, and
[`docs/`](./docs) for deploy/backend details.

## What talks to what

```
web/ (this app, :5173)  ──/api/*──►  archive/artifacts/api-server (:5000)
                                          └─► Postgres · Solana devnet · OpenAI · TxLINE
```

> Note: CI in `.github/` and the deploy config under `archive/` reference the old
> root paths; they'll need updating if/when the archived app is revived or the new
> `web/` app is wired up for deployment.
