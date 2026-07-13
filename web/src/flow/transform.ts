// ─────────────────────────────────────────────────────────────────────────────
// AI portrait transform — isolated, stateless. Given a photo + card inputs, it
// POSTs to /api/aura/transform and returns the generated image (plus VRF fields).
// Retries on rate-limiting (429) and transient 5xx/network errors with
// exponential backoff. All the messy retry/classification logic lives here so
// the flow components never have to think about it.
// ─────────────────────────────────────────────────────────────────────────────

import type { Gender, TransformErrorKind } from "./types";
import { getAuraTier } from "./types";

// Thrown when the transform ultimately fails. `kind` distinguishes "server is at
// capacity" (auto-retryable, softer copy) from a generic AI failure.
export class TransformError extends Error {
  constructor(
    public readonly kind: TransformErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "TransformError";
  }
}

export interface TransformInput {
  /** The photo source (blob:, data:, or /avatar-N.png path). */
  photoSrc: string | null;
  nation: string;
  archetype: string;
  aura: number;
  energy: string;
  walkout: string;
  weapon: string;
  gender?: Gender | null;
  styleVariant?: "realistic" | "comic" | "fantasy";
}

export interface TransformResult {
  image: string;
  vrfSlug?: string;
  vrfSeedHex?: string;
  vrfSlot?: number;
  vrfArchetype?: string;
  vrfProphecy?: string;
  vrfStatDeltas?: Record<string, number>;
}

// gpt-image-1 edits typically take ~60-70s; give each attempt headroom so a
// slow-but-successful generation isn't aborted prematurely.
const TRANSFORM_TIMEOUT_MS = 120_000;
const TRANSFORM_MAX_ATTEMPTS = 4;

const srcToBase64 = (src: string): Promise<string> =>
  fetch(src)
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }),
    );

export async function requestAuraTransform(input: TransformInput): Promise<TransformResult> {
  const base64 = input.photoSrc ? await srcToBase64(input.photoSrc) : null;
  if (!base64) throw new TransformError("ai_error", "No photo to transform");

  let lastError: unknown = null;
  let allCapacity = true; // stays true only if every retryable failure is 429 capacity

  for (let attempt = 0; attempt < TRANSFORM_MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TRANSFORM_TIMEOUT_MS);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/aura/transform`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          image: base64,
          nation: input.nation,
          archetype: input.archetype,
          energy: input.energy,
          walkout: input.walkout,
          weapon: input.weapon,
          ...(input.styleVariant ? { styleVariant: input.styleVariant } : {}),
          ...(input.gender ? { gender: input.gender } : {}),
          auraTier: getAuraTier(input.aura ?? 50),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const image: string | null = data.image ?? null;
        if (image) {
          return {
            image,
            vrfSlug: data.vrfSlug as string | undefined,
            vrfSeedHex: data.vrfSeedHex as string | undefined,
            vrfSlot: data.vrfSlot as number | undefined,
            vrfArchetype: data.vrfArchetype as string | undefined,
            vrfProphecy: data.vrfProphecy as string | undefined,
            vrfStatDeltas: data.vrfStatDeltas as Record<string, number> | undefined,
          };
        }
        allCapacity = false;
        lastError = new Error("Transform returned no image");
      } else if (res.status === 429) {
        // Only treat as capacity when the server explicitly says so.
        let body: Record<string, unknown> = {};
        try {
          body = await res.json();
        } catch {
          /* ignore */
        }
        if (body.reason === "capacity_rejected") {
          lastError = new Error("Transform rejected (capacity)");
        } else {
          allCapacity = false;
          lastError = new Error("Transform rejected (429)");
        }
      } else if (res.status >= 500) {
        allCapacity = false;
        lastError = new Error(`Transform failed (${res.status})`);
      } else {
        // Client error (400/413/etc.) - retrying won't help.
        throw new TransformError("ai_error", `Transform rejected (${res.status})`);
      }
    } catch (err) {
      if (err instanceof TransformError) throw err;
      // AbortError (timeout) and network failures are retryable but not capacity.
      allCapacity = false;
      lastError = err;
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < TRANSFORM_MAX_ATTEMPTS - 1) {
      const backoff = Math.min(8000, 1000 * 2 ** attempt) + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  const kind: TransformErrorKind = allCapacity ? "capacity" : "ai_error";
  throw new TransformError(kind, String(lastError ?? "Transform failed"));
}
