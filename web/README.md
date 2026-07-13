# World Cup Aura — Web (frontend)

A clean, self-contained rebuild of the World Cup Aura frontend. **Everything the
app needs lives inside this folder** — no reaching into the monorepo's `lib/` or
`artifacts/`. Same look and same features as the original; the difference is the
structure is built to be modified.

## Run it

```bash
cd web
pnpm install        # standalone — its own lockfile, not part of the monorepo
pnpm dev            # http://localhost:5173
```

The app calls the backend over `/api/*`. In dev, Vite proxies `/api` →
`http://localhost:5000` (override with `VITE_API_PROXY_TARGET`). So to exercise
the full flow (AI transform, save, mint), also run the api-server:

```bash
# in a second terminal, from the repo root
cd artifacts/api-server && PORT=5000 DATABASE_URL=... pnpm run dev
```

`/docs` and the landing UI work without the backend; anything that hits the API
(transform, save, mint, community wall) needs it running.

Scripts: `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm typecheck`, `pnpm test`.

## What talks to what

```
web (this folder, :5173)  ──/api/*──►  api-server (:5000)  ──►  Postgres + Solana devnet + OpenAI
```

The backend and its shared libs still live in the monorepo (`artifacts/api-server`,
`lib/*`). This rebuild only replaces the frontend; the API contract is unchanged.

## Structure

```
src/
  main.tsx            entry: fonts, api base URL, analytics, Solana providers
  App.tsx             router (/, /card/:slug, /docs, 404)
  index.css           design tokens — the "aesthetic" (copied verbatim)

  routes/             one file per page
    Home.tsx            = <AuraFlowProvider><AuraFlow/></AuraFlowProvider>
    CardPreview.tsx     shared card page (/card/:slug)
    Docs.tsx            the docs page

  flow/               THE home experience (was one 2,666-line file)
    AuraFlowProvider.tsx  the single state container: one reducer holding ALL
                          flow state + named actions (answerQuiz, nextQuizStep,
                          mint, remix…) + the async orchestration. Consume with
                          useAuraFlow().
    types.ts              flow types + constants
    transform.ts          AI portrait request (retry/backoff/capacity logic)
    capture.ts            html2canvas + the 3 share-image canvas builders
    AuraFlow.tsx          orchestrator: background, navbar, step switch, sheets
    steps/                one component per screen — this is where you edit UI
      LandingStep · PhotoStep · QuizStep · ScannerStep · ResultStep · Overlays

  components/         presentational components + ui/ primitives
  lib/               pure logic (scoring, rarity, playerMatch…) + tests
  api/               vendored HTTP client (was @workspace/api-client-react)
  solana/            wallet providers + helpers   (SolanaProviders, solanaWallet)
```

### How to change things
- **Tweak a screen's UI** → edit the matching file in `flow/steps/`.
- **Add/altering state or a handler** → `flow/AuraFlowProvider.tsx` (state in
  `FlowState`, behavior in the named `actions`).
- **Change colors / spacing tokens** → `src/index.css`.
- **Backend shape changed** → regenerate the client into `src/api/generated/`.
