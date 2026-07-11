import { fal } from "@fal-ai/client";

const FAL_API_KEY = process.env.FAL_API_KEY;

if (FAL_API_KEY) {
  fal.config({ credentials: FAL_API_KEY });
} else {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[fluxKontext] FAL_API_KEY is not set — portrait generation via FLUX Kontext will fail. Set the secret in Replit Secrets.",
    );
  }
}

export function isFluxConfigured(): boolean {
  return Boolean(FAL_API_KEY);
}

type FalImage = { url: string; content_type?: string };

type FalFluxOutput = {
  images: FalImage[];
  timings?: Record<string, number>;
};

/**
 * Transform a selfie into a stylized portrait using FLUX Kontext Pro.
 *
 * @param imageDataUrl  The selfie as a data URL (PNG/JPEG/WebP).
 * @param prompt        The styled prompt built by buildPrompt().
 * @returns             Raw image bytes (JPEG from fal.ai CDN).
 */
export async function transformWithFlux(
  imageDataUrl: string,
  prompt: string,
): Promise<Buffer> {
  if (!FAL_API_KEY) {
    throw new Error(
      "FAL_API_KEY is not configured. Portrait generation is unavailable.",
    );
  }

  const mimeMatch = imageDataUrl.match(/^data:([^;]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const base64Data = imageDataUrl.replace(/^data:[^;]+;base64,/, "");
  const bytes = Buffer.from(base64Data, "base64");
  const blob = new Blob([bytes], { type: mimeType });
  const file = new File([blob], "selfie.jpg", { type: mimeType });

  const uploadedUrl = await fal.storage.upload(file);

  const result = await fal.subscribe("fal-ai/flux-kontext-pro", {
    input: {
      prompt,
      image_url: uploadedUrl,
      guidance_scale: 3.5,
      num_inference_steps: 28,
      output_format: "jpeg",
    },
    logs: false,
  });

  const output = result.data as FalFluxOutput;
  const imageUrl = output?.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error("FLUX Kontext returned no image URL.");
  }

  const resp = await fetch(imageUrl);
  if (!resp.ok) {
    throw new Error(
      `Failed to fetch generated image from fal.ai CDN: ${resp.status}`,
    );
  }

  return Buffer.from(await resp.arrayBuffer());
}
