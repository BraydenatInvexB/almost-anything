import "server-only";

import { createImglyProvider } from "./imgly";
import { createOpenAiEditProvider } from "./openai-edit";
import { createRemoveBgProvider } from "./remove-bg";
import type { WhiteBackgroundProvider } from "./types";

export type { WhiteBackgroundProvider } from "./types";

/**
 * Provider order:
 * 1. OpenAI Images Edit (existing OPENAI_API_KEY)
 * 2. remove.bg (optional REMOVE_BG_API_KEY)
 * 3. Local IMG.LY ONNX
 */
export function resolveWhiteBackgroundProviders(): WhiteBackgroundProvider[] {
  return [createOpenAiEditProvider(), createRemoveBgProvider(), createImglyProvider()].filter((p) =>
    p.isAvailable(),
  );
}
