# Frontend on Replit — setup for the founder

You edit the **frontend** in Replit; Bilal works in Claude Code. You both sync
through **one GitHub repo** (`Digitalfrontiersman/World-Cup-Aura`) — neither of you
touches the other's tool. You never run the backend: your dev app talks to the
**live** backend automatically.

You only ever edit files under **`web/src/`** (the React frontend). Everything else
(backend, build, deploy) is handled outside Replit.

---

## One-time setup (~3 minutes)

1. **Create the Repl from the repo**
   - Replit → **Create Repl** → **Import from GitHub** → pick
     `Digitalfrontiersman/World-Cup-Aura`.
   - (If GitHub isn't linked yet, Replit will prompt you to connect it once.)

2. **Make your own branch**
   - Open the **Git** pane (left sidebar). You'll be on `main` (it's current).
   - Create a branch to work on: type `founder` and **Create branch**.
     You'll commit to `founder`; Bilal merges it in.

3. **Add the one secret** (so the app hits the live backend)
   - Left sidebar → **Secrets** (lock icon) → add:
     - Key: `VITE_API_PROXY_TARGET`
     - Value: `https://worldcupaura.com`

4. **Hit Run.** It installs and starts the frontend. The webview shows a fully
   working app (real cards, odds, mint) — because `/api/*` is proxied to the live
   backend. First run takes a minute to install.

---

## Day-to-day loop

1. Git pane → **Pull** (get the latest before you start).
2. Edit components under `web/src/` — the webview hot-reloads as you save.
3. Git pane → **Commit** (write a short message) → **Push**.
4. Ping Bilal: "pushed some frontend changes on `founder`."
5. Bilal reviews, merges into `Bilal`, and deploys to production. You never deal
   with the server.

---

## Good to know

- **Where to edit:** `web/src/components/*` and `web/src/flow/steps/*` are the
  screens/UI. Stay in `web/src/`.
- **Don't edit** `web/src/api/*` (generated), build config, or anything outside
  `web/` — those are Bilal's side.
- **The app just works without the backend** because of the proxy secret; if the
  webview shows API errors, double-check `VITE_API_PROXY_TARGET` is set to
  `https://worldcupaura.com`.
- **Conflicts:** always **Pull** before you start and before you push. Since you
  only touch `web/src`, conflicts should be rare.
