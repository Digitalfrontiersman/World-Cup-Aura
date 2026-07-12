# Deploying World Cup Aura to DigitalOcean App Platform

This app moves to **DigitalOcean App Platform** for compute. **The database does
not move** — it stays on Neon, and both your current Replit deploy and the new
DO app talk to the *same* Neon database. That means:

- **Zero data risk / zero migration.** No dump, no restore, no cutover. We reuse
  the same `DATABASE_URL`.
- **Zero downtime.** Bring the DO app up, verify it, then flip DNS. Until DNS
  flips, Replit keeps serving. If anything looks wrong, you flip DNS back —
  instant rollback. Postgres happily serves both clients the whole time.

## What was built (already in the repo)

| File | Purpose |
|---|---|
| `artifacts/api-server/Dockerfile` | Builds the API into a self-contained Node bundle. **Verified locally** (image builds + boots). |
| `.dockerignore` | Keeps secrets/`node_modules` out of the image. |
| `.do/app.yaml` | App Platform spec: `web` (static frontend at `/`) + `api` (Express at `/api`), one domain. |
| `package.json` | Added `"packageManager": "pnpm@10.33.2"` so the build uses the right pnpm. |

Architecture on App Platform: **one app, two components, one origin.** The
static frontend is served at `/`; the API at `/api` (health at `/api/healthz`).
Same origin ⇒ the frontend's `/api/*` calls need no cross-origin CORS.

---

## Your part

### 0. Deploy branch (already set)
The spec tracks the **`Bilal`** branch (both components in `.do/app.yaml`),
because `main` receives the designer's frontend pushes and should not trigger
production deploys. Every push to `Bilal` rebuilds prod (`deploy_on_push: true`).
Nothing to change — the config already lives on `Bilal`. Do your integration on
`Bilal` (merge `main` → `Bilal` when you want the designer's work to go live).

### 1. Create the DO app + connect GitHub
Two ways:

**UI (the clicks path):**
1. DigitalOcean → **Apps → Create App**.
2. Choose **GitHub**, authorize the DigitalOcean GitHub app on
   `Digitalfrontiersman/World-Cup-Aura`, pick the branch from step 0.
3. When it asks, choose **"Edit your app spec"** and paste the contents of
   `.do/app.yaml` (or upload it). This gives you the exact two-component setup
   instead of letting autodetect guess.

**CLI (reproducible):**
```bash
doctl auth init                       # paste a DO API token
doctl apps create --spec .do/app.yaml
```

### 2. Set the secret values
The spec ships with `REPLACE_IN_DASHBOARD` placeholders. In **App → Settings →
(component) → Environment Variables**, set the real values. Every value below you
already have — copy them from your current Replit Secrets or local `.env` files.

**`api` component:**

| Variable | Where to get it | Secret |
|---|---|---|
| `DATABASE_URL` | **Same Neon string you use today** — copy from Replit Secrets / `artifacts/api-server/.env`. (Optional: use Neon's **pooled** `...-pooler...` host if you later run >1 instance.) | ✅ |
| `OPENAI_API_KEY` | Your OpenAI key (current Replit secret) | ✅ |
| `SOLANA_TREASURY_SECRET_KEY` | The **`secretKey`** (base58) field inside `artifacts/api-server/.solana-treasury.json` | ✅ |
| `SOLANA_DEVNET_RPC_URL` | The `rpcUrl` from that same file / your Helius URL | ✅ |
| `ZIINA_API_KEY` | From `artifacts/api-server/.env` (`ZIINA_API_KEY=…`) | ✅ |
| `TXLINE_API_TOKEN` | From your `.env` / TxLINE activation (omit to disable the live ticker) | ✅ |
| `ZIINA_TEST_MODE` | Leave `"true"` until you're ready for real payments | — |
| `CORS_ALLOWED_ORIGINS` | Preset to your domains; add the `*.ondigitalocean.app` URL if you test there | — |

**`web` component (build-time, baked into the JS bundle):**

| Variable | Where to get it | Secret |
|---|---|---|
| `VITE_SOLANA_DEVNET_RPC_URL` | Helius devnet URL/key — from `artifacts/aura-card/.env` | ✅* |
| `VITE_APP_URL` | Preset to `https://worldcupaura.com` | — |
| `VITE_GA_MEASUREMENT_ID`, `VITE_FB_PIXEL_ID`, `VITE_POSTHOG_API_KEY`, `VITE_POSTHOG_HOST` | Optional analytics — leave blank to disable | — |

\* Any `VITE_` value ships to the browser regardless; SECRET-typing just keeps it
out of the dashboard's plaintext view.

### 3. Neon: confirm access (usually nothing to do)
Neon allows connections from anywhere by default, so the DO app connects with no
change. **Only** if you enabled Neon's *IP Allow* feature, either turn it off or
add DO's egress — simplest is to leave allow-all (auth is via the connection
string). You do **not** create a new database or touch your data.

### 4. Deploy & verify (before any DNS change)
1. Trigger the first deploy (auto on create). Watch **Build** then **Deploy**
   logs. The API is healthy when `/api/healthz` returns `{"status":"ok"}` (it
   pings Neon — a green check means the DB connection works).
2. Open the temporary **`https://<app>.ondigitalocean.app`** URL and smoke-test:
   landing → generate a card → save → the community wall loads (all hit Neon).
3. If the health check fails, it's almost always a wrong `DATABASE_URL` — the log
   line says exactly that.

### 5. Point your domain (cutover)
1. App → **Settings → Domains → Add Domain** → `worldcupaura.com` (+ `www`). DO
   shows the DNS records to create.
2. At your DNS registrar, update the records to DO **only after step 4 passes.**
   This is the cutover; propagation is usually minutes.
3. Keep the Replit deploy running for a day as a hot fallback. **Rollback =
   point DNS back to Replit.** Same DB throughout, so no data reconciliation.

---

## Cost (rough)
- `api` service (`apps-s-1vcpu-1gb`): ~$5–12/mo. Size adjustable in the UI.
- `web` static site: free tier / a few $/mo.
- Neon: unchanged — billed exactly as it is today.

## Notes & gotchas
- **Single API instance is intentional.** Rate limiting is in-memory
  (`express-rate-limit`), correct for one instance. Before scaling to
  `instance_count > 1`, add a shared store (Redis) or limits reset per instance.
- **Region is `sgp`** (Singapore) to sit next to Neon in `ap-southeast-1`.
- **Treasury key = real funds control.** It only lives as an encrypted App
  Platform secret; never commit it. Rotating it = generate a new treasury wallet
  and update the secret.
- **Auto-deploy on push** is on for the chosen branch. Push to that branch →
  App Platform rebuilds. Turn it off in the UI if you prefer manual deploys.
