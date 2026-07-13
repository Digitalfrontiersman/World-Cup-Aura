import { createRoot } from "react-dom/client";
// Self-hosted fonts (bundled, not fetched from Google) so they always load
// regardless of region, privacy browsers, or font-blockers.
// Type system: Clash Display (display/headings/card face/numerals) + Satoshi
// (body/UI) — both self-hosted from public/fonts — plus Geist Mono (on-chain data).
import "./fonts.css";
import "@fontsource-variable/geist-mono";
import { setBaseUrl } from "@/api";
import { initAnalytics } from "@/lib/analytics";
import { SolanaProviders } from "@/components/SolanaProviders";
import App from "./App";
import "./index.css";

// The API hooks build absolute paths like `/api/aura/mint`. This standalone app
// is served from the root, so BASE_URL is "/" → setBaseUrl("") keeps requests
// relative (dev-proxied to the api-server; same-origin in prod).
setBaseUrl(import.meta.env.BASE_URL.replace(/\/+$/, ""));

// Inject GA4 + Facebook Pixel + PostHog before first render (no-op when env vars are absent).
initAnalytics();

createRoot(document.getElementById("root")!).render(
  <SolanaProviders>
    <App />
  </SolanaProviders>,
);
