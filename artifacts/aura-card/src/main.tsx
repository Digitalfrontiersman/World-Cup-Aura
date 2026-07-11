import { createRoot } from "react-dom/client";
// Self-hosted fonts (bundled with the app, not fetched from Google) so they
// always load regardless of region, privacy browsers, or font-blockers.
import "@fontsource-variable/archivo";
import "@fontsource-variable/archivo/wght-italic.css";
import "@fontsource-variable/plus-jakarta-sans";
import { setBaseUrl } from "@workspace/api-client-react";
import { initAnalytics } from "./lib/analytics";
import { SolanaProviders } from "./components/SolanaProviders";
import App from "./App";
import "./index.css";

// The generated API hooks build absolute paths like `/api/aura/mint`. This app is
// served under a base path (e.g. `/aura-card/`), so prepend it to every request.
setBaseUrl(import.meta.env.BASE_URL.replace(/\/+$/, ""));

// Inject GA4 + Facebook Pixel before first render (no-op when env vars are absent).
initAnalytics();

createRoot(document.getElementById("root")!).render(
  <SolanaProviders>
    <App />
  </SolanaProviders>,
);
