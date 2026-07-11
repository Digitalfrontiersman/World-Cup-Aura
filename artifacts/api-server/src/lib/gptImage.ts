import { toFile } from "openai";

export function isGptImageConfigured(): boolean {
  return Boolean(
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL &&
      process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  );
}

/**
 * Transform a selfie into a stylized portrait using GPT Image-1 images.edit.
 *
 * Uses a lazy import of the OpenAI integration client so that a missing env var
 * causes a graceful 503 from the route handler rather than a startup crash.
 *
 * @param imageDataUrl  The selfie as a data URL (PNG/JPEG/WebP).
 * @param prompt        The styled prompt built by buildPrompt().
 * @returns             Raw image bytes (PNG from gpt-image-1).
 */
export async function transformWithGptImage(
  imageDataUrl: string,
  prompt: string,
): Promise<Buffer> {
  if (!isGptImageConfigured()) {
    throw new Error(
      "OpenAI is not configured. Portrait generation is unavailable.",
    );
  }

  const { openai } = await import("@workspace/integrations-openai-ai-server");

  const base64Data = imageDataUrl.replace(/^data:[^;]+;base64,/, "");
  const bytes = Buffer.from(base64Data, "base64");

  const file = await toFile(bytes, "selfie.png", { type: "image/png" });

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: file,
    prompt,
    size: "1024x1024",
  });

  const b64 = response.data?.[0]?.b64_json ?? "";
  if (!b64) {
    throw new Error("gpt-image-1 returned no image data.");
  }

  return Buffer.from(b64, "base64");
}
