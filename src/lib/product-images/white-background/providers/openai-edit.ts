import "server-only";

import { openaiConfigured } from "@/lib/sourcing/llm-client";
import type { WhiteBackgroundProvider } from "./types";

const EDIT_PROMPT =
  "Remove only the background behind the product. Keep the product completely unchanged — identical shape, colours, textures, logos, and details. Do not restyle, regenerate, or alter the product itself.";

/**
 * OpenAI Images Edit — preferred when OPENAI_API_KEY is set.
 * Uses transparent background + high input fidelity so the product stays intact.
 */
export function createOpenAiEditProvider(): WhiteBackgroundProvider {
  return {
    id: "openai-edit",
    isAvailable() {
      return openaiConfigured();
    },
    async process(input) {
      const key = process.env.OPENAI_API_KEY!;
      const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

      const sharp = (await import("sharp")).default;
      const prepared = await sharp(input)
        .rotate()
        .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();

      const form = new FormData();
      form.append("image", new Blob([new Uint8Array(prepared)], { type: "image/png" }), "product.png");
      form.append("prompt", EDIT_PROMPT);
      form.append("model", model);
      form.append("background", "transparent");
      form.append("output_format", "png");
      form.append("quality", process.env.OPENAI_IMAGE_QUALITY ?? "high");
      // Preserve product appearance as closely as possible.
      form.append("input_fidelity", "high");

      const res = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: form,
        signal: AbortSignal.timeout(120_000),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`OpenAI image edit failed (${res.status}): ${detail.slice(0, 240)}`);
      }

      const data = (await res.json()) as {
        data?: { b64_json?: string; url?: string }[];
      };
      const first = data.data?.[0];
      if (first?.b64_json) {
        return { kind: "cutout", bytes: Buffer.from(first.b64_json, "base64") };
      }
      if (first?.url) {
        const img = await fetch(first.url, { signal: AbortSignal.timeout(30_000) });
        if (!img.ok) throw new Error("OpenAI edit URL download failed.");
        return { kind: "cutout", bytes: Buffer.from(await img.arrayBuffer()) };
      }

      throw new Error("OpenAI image edit returned no image.");
    },
  };
}
