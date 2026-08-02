import "server-only";

import { applyWhiteBackground } from "@/lib/product-images/white-background";
import type {
  WhiteBackgroundOptions,
  WhiteBackgroundResult,
} from "@/lib/product-images/white-background";

const MAX_REMOTE_BYTES = 8 * 1024 * 1024;

/**
 * Download a remote product image and optionally apply the white-background pipeline.
 */
export async function prepareProductImageFromUrl(
  url: string,
  options?: WhiteBackgroundOptions,
): Promise<WhiteBackgroundResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Enter a valid image URL.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Image URL must start with http(s).");
  }

  const res = await fetch(parsed.toString(), {
    headers: { Accept: "image/*" },
    signal: AbortSignal.timeout(20_000),
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error("Couldn't download that image URL.");
  }

  const type = res.headers.get("content-type") ?? "";
  if (type && !type.startsWith("image/") && !type.includes("octet-stream")) {
    throw new Error("URL does not point to an image.");
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 32) throw new Error("Image is empty.");
  if (bytes.length > MAX_REMOTE_BYTES) throw new Error("Remote image must be under 8 MB.");

  return applyWhiteBackground(bytes, options);
}
