import "server-only";

import type { WhiteBackgroundProvider } from "./types";

/** Optional remove.bg API — set REMOVE_BG_API_KEY. */
export function createRemoveBgProvider(): WhiteBackgroundProvider {
  return {
    id: "remove-bg",
    isAvailable() {
      return Boolean(process.env.REMOVE_BG_API_KEY?.trim());
    },
    async process(input) {
      const key = process.env.REMOVE_BG_API_KEY!.trim();
      const form = new FormData();
      form.append("size", "auto");
      form.append("format", "png");
      form.append("image_file", new Blob([new Uint8Array(input)]), "product.png");

      const res = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": key },
        body: form,
        signal: AbortSignal.timeout(60_000),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`remove.bg failed (${res.status}): ${detail.slice(0, 200)}`);
      }

      return { kind: "cutout", bytes: Buffer.from(await res.arrayBuffer()) };
    },
  };
}
