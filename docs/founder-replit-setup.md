# Frontend on Replit — Jonathan's setup

You edit the **frontend** in Replit; Bilal works in Claude Code. You sync through
**one GitHub repo**: `Digitalfrontiersman/World-Cup-Aura`. You never run the
backend — your preview talks to the **live** one automatically.

**You only edit files under `web/src/`.**

---

## One-time setup (~3 min)

1. **Import the repo**
   Replit → **Create** → **Import from GitHub** → `Digitalfrontiersman/World-Cup-Aura`.

2. **Make your branch**
   Git pane (left) → you're on `main` → create a branch named **`founder`**.
   You commit to `founder`; Bilal merges it in.

3. **Add one Secret** (lock icon in the left sidebar)
   - Key: `VITE_API_PROXY_TARGET`
   - Value: `https://worldcupaura.com`

   This makes the whole app work (cards, mint, samples) against the live backend.
   No `.env` file needed — everything else has safe defaults.

4. **Hit Run.** First run installs for a minute, then the preview loads a fully
   working app. It hot-reloads as you edit.

---

## Day-to-day

1. Git pane → **Pull** (get latest first).
2. Edit under `web/src/` — preview updates live.
3. Git pane → **Commit** → **Push**.
4. Tell Bilal: "pushed frontend changes on `founder`." He reviews, merges, deploys.

---

## Notes

- **Edit here:** `web/src/components/*` and `web/src/flow/steps/*` (the screens/UI).
- **Don't touch:** anything outside `web/src/` (backend, build, deploy — Bilal's side).
- **API errors in the preview?** Check the `VITE_API_PROXY_TARGET` Secret is set to
  `https://worldcupaura.com`.
- Always **Pull** before you start and before you push to avoid conflicts.
