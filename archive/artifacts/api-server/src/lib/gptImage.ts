import { toFile } from "openai";

// The OpenAI integration package expects Replit's managed-integration env names
// (AI_INTEGRATIONS_OPENAI_*). Bridge a plain OPENAI_API_KEY - the name our
// .env.example/README document - onto them, defaulting the base URL to public
// OpenAI. This makes local setup with a normal key "just work".
function applyOpenAiEnvBridge(): void {
  if (
    !process.env.AI_INTEGRATIONS_OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY
  ) {
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  }
  if (
    !process.env.AI_INTEGRATIONS_OPENAI_BASE_URL &&
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY
  ) {
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL =
      process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  }
}
applyOpenAiEnvBridge();

export function isGptImageConfigured(): boolean {
  applyOpenAiEnvBridge();
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
    // Explicit "medium" instead of the default "auto" (which resolves to the
    // slow, pricey "high" tier for detailed prompts). Medium is markedly faster
    // AND ~4x cheaper in output tokens, so this speeds generation up without
    // increasing credit usage. Drop to "low" for maximum speed if needed.
    quality: "medium",
  });

  const b64 = response.data?.[0]?.b64_json ?? "";
  if (!b64) {
    throw new Error("gpt-image-1 returned no image data.");
  }

  return Buffer.from(b64, "base64");
}
