import "server-only";

import { OUTPUT_JPEG_QUALITY } from "./constants";
import {
  compositeOntoWhite,
  frameOnWhite,
  hasMeaningfulAlpha,
} from "./compose";
import { detectAlreadyWhiteBackground } from "./detect-already-white";
import { normalizeWhiteBackgroundOptions } from "./options";
import { resolveWhiteBackgroundProviders } from "./providers";
import type { WhiteBackgroundOptions, WhiteBackgroundResult } from "./types";

/** Normalize without changing the scene — EXIF rotate + JPEG only. */
async function passthroughJpeg(input: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp(input)
    .rotate()
    .jpeg({ quality: OUTPUT_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
}

/**
 * Prepare a product photo for the catalog.
 * Toggle off → leave the photo as-is.
 * Toggle on → remove backdrop (OpenAI / fallbacks) and place on pure white,
 * unless vision (OpenAI/Claude) says it already has a white background.
 */
export async function applyWhiteBackground(
  input: Buffer,
  options?: WhiteBackgroundOptions,
): Promise<WhiteBackgroundResult> {
  if (!input.length) {
    throw new Error("Empty image.");
  }

  const opts = normalizeWhiteBackgroundOptions(options);

  if (!opts.enabled) {
    return {
      bytes: await passthroughJpeg(input),
      contentType: "image/jpeg",
      method: "unchanged",
    };
  }

  if (opts.skipIfAlreadyWhite) {
    const alreadyWhite = await detectAlreadyWhiteBackground(input);
    if (alreadyWhite) {
      return {
        bytes: await passthroughJpeg(input),
        contentType: "image/jpeg",
        method: "already-white",
      };
    }
  }

  // Already a cutout — flatten onto white (no generative AI needed).
  if (await hasMeaningfulAlpha(input)) {
    return {
      bytes: await compositeOntoWhite(input),
      contentType: "image/jpeg",
      method: "alpha-flatten",
    };
  }

  for (const provider of resolveWhiteBackgroundProviders()) {
    try {
      const output = await provider.process(input);
      if (output.kind === "final") {
        return {
          bytes: await compositeOntoWhite(output.bytes),
          contentType: "image/jpeg",
          method: provider.id === "openai-edit" ? "ai-edit" : "ai-remove",
        };
      }
      return {
        bytes: await compositeOntoWhite(output.bytes),
        contentType: "image/jpeg",
        method: provider.id === "openai-edit" ? "ai-edit" : "ai-remove",
      };
    } catch {
      // Try the next provider.
    }
  }

  return {
    bytes: await frameOnWhite(input),
    contentType: "image/jpeg",
    method: "white-frame",
  };
}
