import posthog from "posthog-js";

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const FB_ID = import.meta.env.VITE_FB_PIXEL_ID as string | undefined;
const PH_KEY = import.meta.env.VITE_POSTHOG_API_KEY as string | undefined;
const PH_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
    fbq: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
    };
    _fbq: Window["fbq"];
  }
}

export function initAnalytics(): void {
  if (GA_ID) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
  }

  if (FB_ID) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        fbq.queue!.push(args);
      }
    } as Window["fbq"];

    if (!window._fbq) window._fbq = fbq;
    window.fbq = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    window.fbq("init", FB_ID);
    window.fbq("track", "PageView");
  }

  if (PH_KEY) {
    posthog.init(PH_KEY, {
      api_host: PH_HOST,
      autocapture: true,
      session_recording: {
        maskAllInputs: false,
      },
    });
  }
}

export function trackStep(stepName: string, extraProps?: Record<string, unknown>): void {
  if (GA_ID && typeof window.gtag === "function") {
    window.gtag("event", stepName, extraProps ?? {});
  }
  if (FB_ID && typeof window.fbq === "function") {
    window.fbq("trackCustom", stepName, extraProps ?? {});
  }
  if (PH_KEY) {
    posthog.capture(stepName, extraProps);
  }
}

export function trackPurchase(): void {
  if (FB_ID && typeof window.fbq === "function") {
    window.fbq("track", "Purchase", { value: 0, currency: "USD" });
  }
  if (PH_KEY) {
    posthog.capture("aura_mint_success", { value: 0, currency: "USD" });
  }
}

export function trackViewContent(): void {
  if (FB_ID && typeof window.fbq === "function") {
    window.fbq("track", "ViewContent", { content_name: "AuraCard Experience" });
  }
  if (PH_KEY) {
    posthog.capture("view_content");
  }
}

export function trackGenerateAuraCard(): void {
  if (FB_ID && typeof window.fbq === "function") {
    window.fbq("track", "CompleteRegistration", { content_name: "AuraCard Generated" });
    window.fbq("trackCustom", "GenerateAuraCard");
  }
  if (PH_KEY) {
    posthog.capture("GenerateAuraCard");
  }
}

export function trackShareAuraCard(method: string): void {
  if (FB_ID && typeof window.fbq === "function") {
    window.fbq("trackCustom", "ShareAuraCard", { method });
  }
  if (PH_KEY) {
    posthog.capture("ShareAuraCard", { method });
  }
}
