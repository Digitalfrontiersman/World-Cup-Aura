import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// PORT and BASE_PATH are injected by Replit's artifact runner in production
// (see .replit-artifact/artifact.toml). Locally they're usually unset, so we
// default them instead of throwing — this keeps `pnpm dev`/`build` working
// off-Replit and avoids Git Bash mangling a bare `BASE_PATH=/` on Windows.
// Replit always overrides these, so production behaviour is unchanged.
const port = Number(process.env.PORT) || 5173;
const basePath = process.env.BASE_PATH || "/";

// Locally the frontend and api-server are two separate processes, so the app's
// same-origin `/api/*` calls (see src/main.tsx) need to be proxied to the
// api-server. On Replit the artifact path-router does this stitching instead, so
// this proxy is dev-only and harmless there. Override the target with
// VITE_API_PROXY_TARGET if the api-server runs on a non-default port.
const apiProxyTarget =
  process.env.VITE_API_PROXY_TARGET || "http://localhost:5000";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    nodePolyfills({
      include: ["buffer", "stream", "events", "crypto", "util", "process", "vm", "http", "https", "url", "zlib"],
      globals: { Buffer: true, global: true, process: true },
    }),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      "/api": { target: apiProxyTarget, changeOrigin: true },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
