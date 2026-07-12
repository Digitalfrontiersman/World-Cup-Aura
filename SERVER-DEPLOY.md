# World Cup Aura — self-hosted deployment (OVH VPS)

Live at **https://worldcupaura.com**, co-hosted on the OVH box `142.44.240.184`
(`vps-55983430`) alongside the streaming (`rivalseth`) and clipping
(`24hourclipping`) projects. The app is **isolated** from them: its API runs in a
resource-capped Docker container and it has its own nginx vhost. **The database
stays on Neon** — this box only runs compute.

Reach the box over the `rivals-mesh` tunnel: `ssh ubuntu@10.8.0.2`
(public `:22` is firewalled; mesh only).

## Layout on the server
| Path | What |
|---|---|
| `/opt/worldcupaura/app/` | app source (synced from the `Bilal` branch) |
| `/opt/worldcupaura/docker-compose.yml` | API service: build, `127.0.0.1:8091:8080`, `cpus 1.5`, `mem 1g`, log-rotated, `restart: unless-stopped` |
| `/opt/worldcupaura/api.env` | API secrets (root `600`) — DATABASE_URL (Neon), OPENAI, ZIINA, SOLANA treasury, CORS |
| `/opt/worldcupaura/web.build.env` | build-time `VITE_*` (root `600`) |
| `/opt/worldcupaura/redeploy.sh` | one-shot rebuild+reload helper |
| `/var/www/worldcupaura/` | built static frontend (nginx docroot) |
| `/etc/nginx/sites-available/worldcupaura.com.conf` | vhost: static + `/api`→container, TLS (certbot), HTTP→HTTPS redirect |

## Architecture
```
Internet ──▶ nginx :443 (host)
              ├─ server_name worldcupaura.com
              │    ├─ location /       → /var/www/worldcupaura (SPA)
              │    └─ location /api/    → 127.0.0.1:8091  (wca-api container) ──▶ Neon (Postgres)
              ├─ clip42.duckdns.org     → 24hourclipping (untouched)
              └─ origin-ovh.rivalseth.com → streaming (untouched)
```

## Redeploy (after code changes on `Bilal`)
From the **dev machine** (this repo), sync the branch to the server:
```bash
git archive --format=tar HEAD | ssh -i ~/.ssh/wca_deploy ubuntu@10.8.0.2 \
  'rm -rf /tmp/wca && mkdir -p /tmp/wca && tar xf - -C /tmp/wca \
   && sudo cp -a /tmp/wca/. /opt/worldcupaura/app/ && rm -rf /tmp/wca'
```
Then on the **server**, rebuild everything:
```bash
sudo /opt/worldcupaura/redeploy.sh
```
API-only quick restart: `cd /opt/worldcupaura && sudo docker compose up -d --build`.

## Operations
- **Logs:** `sudo docker logs wca-api -f` (JSON, rotated 3×10 MB).
- **Status/health:** `curl -s http://127.0.0.1:8091/api/healthz` → `{"status":"ok"}`.
- **Restart:** `cd /opt/worldcupaura && sudo docker compose restart`.
- **Change a secret:** edit `/opt/worldcupaura/api.env` (root), then `docker compose up -d` (recreates the container).
- **TLS:** auto-renews (certbot). Manual: `sudo certbot renew`.

## Rollback
- **App:** repoint DNS `@`/`www` back to `34.111.179.208`, or stop this app only:
  `cd /opt/worldcupaura && sudo docker compose down` (streaming/clipping unaffected).
- **Database:** the DB was migrated Neon Singapore → Neon **US-East** (`us-east-1`,
  near the Montreal box) for latency. The Singapore project is retained, untouched,
  as fallback. To roll back the DB:
  `sudo cp /opt/worldcupaura/api.env.singapore-fallback /opt/worldcupaura/api.env && cd /opt/worldcupaura && sudo docker compose up -d`
  Don't delete the Singapore Neon project until you're confident in US-East.

## Known behavior / follow-ups
- **Neon cold-start:** Neon auto-suspends when idle, so the first request after a
  quiet spell can briefly 503 (`degraded`) while it wakes (~1–3 s), then recovers.
  Live traffic keeps it warm. To eliminate entirely, add a keep-alive (a root
  cron pinging `/api/healthz` every 5 min) or disable auto-suspend in Neon.
- **Single instance:** rate limiting is in-memory (correct for 1 container). Don't
  scale to N replicas without a shared store.
- **Security TODO:** the SSH password was exposed in chat — rotate it (`passwd`),
  and consider disabling SSH password auth now that key auth works.
