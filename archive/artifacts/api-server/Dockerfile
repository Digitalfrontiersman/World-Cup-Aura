# syntax=docker/dockerfile:1
# ============================================================================
# api-server production image for DigitalOcean App Platform.
#
# Build context MUST be the repo root (the pnpm workspace root), because the
# server imports @workspace/db, @workspace/api-zod and
# @workspace/integrations-openai-ai-server from their TypeScript source and
# esbuild bundles them in. App Platform is configured for this via
# `source_dir: /` + `dockerfile_path: artifacts/api-server/Dockerfile` in
# .do/app.yaml.
# ============================================================================

# ---- Builder: install the api-server subtree + bundle with esbuild ---------
FROM node:24-slim AS builder
WORKDIR /repo

# Pin the exact pnpm that produced pnpm-lock.yaml (lockfileVersion 9.0) so
# --frozen-lockfile is deterministic.
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

# Whole monorepo: workspace manifests, lockfile, catalog config, and every
# package the API pulls in.
COPY . .

# Install ONLY the api-server and the workspace packages it depends on
# (the trailing "..." pulls in @workspace/db etc.). devDeps are needed here
# because esbuild does the bundling.
RUN pnpm install --frozen-lockfile --filter "@workspace/api-server..."

# esbuild -> single self-contained dist/index.mjs (+ pino worker files).
RUN pnpm --filter @workspace/api-server run build

# ---- Runtime: just Node + the bundle. No node_modules, no source. ----------
FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# esbuild inlines all JS dependencies; only the bundle and the pino worker
# files it emits alongside it are needed at runtime.
COPY --from=builder /repo/artifacts/api-server/dist ./dist

# App Platform injects PORT (typically 8080); index.ts reads process.env.PORT.
EXPOSE 8080

# index.ts installs SIGTERM/SIGINT graceful-shutdown handlers, so running node
# directly (PID 1 receives the signals) is correct.
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
