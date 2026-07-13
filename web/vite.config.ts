import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "node:path";

// Standalone frontend. In dev it runs on :5173 and proxies /api/* to the
// api-server (defaults to localhost:5000 — override with VITE_API_PROXY_TARGET).
// The Solana wallet stack needs a few Node globals in the browser, hence the
// node-polyfills plugin (Buffer/process/etc).
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:5000";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ["buffer", "stream", "events", "crypto", "util", "process", "vm", "http", "https", "url", "zlib"],
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": { target: apiProxyTarget, changeOrigin: true },
    },
  },
  preview: {
    port: 5173,
    host: true,
  },
});
