import "server-only";

/**
 * Download supplier product photos, enhance clarity, and persist to Supabase Storage.
 */

import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";

import { validateProductImageBytes } from "@/lib/sourcing/product-image-quality";

const USER_AGENT =
  "Mozilla/5.0 (compatible; AlmostAnythingBot/1.0; +https://almostanything.store)";

export async function downloadImageBytes(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "image/*" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;

    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 1024 ? buf : null;
  } catch {
    return null;
  }
}

export async function enhanceImageBytes(input: Buffer): Promise<Buffer> {
  const validation = await validateProductImageBytes(input);
  if (!validation.ok) {
    throw new Error("Image failed quality validation");
  }

  const sharp = (await import("sharp")).default;
  return sharp(input)
    .rotate()
    .resize(1200, 1200, {
      fit: "contain",
      background: { r: 248, g: 248, b: 248, alpha: 1 },
    })
    .sharpen({ sigma: 0.85 })
    .modulate({ brightness: 1.02, saturation: 1.04 })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

export async function downloadAndValidateImage(
  url: string,
  options?: { relaxed?: boolean },
): Promise<{ bytes: Buffer; score: number } | null> {
  const bytes = await downloadImageBytes(url);
  if (!bytes) return null;

  const validation = await validateProductImageBytes(bytes, options);
  if (!validation.ok) return null;

  return { bytes, score: validation.score };
}

export async function uploadProductImage(
  bytes: Buffer,
  slug: string,
  suffix: "original" | "enhanced",
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createServiceClient();
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, "-").slice(0, 60);
  const objectPath = `discovered/${safeSlug}-${suffix}-${Date.now()}.jpg`;

  const { error } = await supabase.storage.from("product-images").upload(objectPath, bytes, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) return null;

  const { data } = supabase.storage.from("product-images").getPublicUrl(objectPath);
  return data.publicUrl;
}

export type StoredProductImage = {
  imageUrl: string;
  enhancedImageUrl: string;
};

/**
 * Download from supplier, enhance for storefront display, store both versions.
 */
export async function enhanceAndStoreProductImage(
  sourceUrl: string,
  slug: string,
  prevalidatedBytes?: Buffer,
): Promise<StoredProductImage | null> {
  const originalBytes = prevalidatedBytes ?? (await downloadImageBytes(sourceUrl));
  if (!originalBytes) return null;

  let enhancedBytes: Buffer;
  try {
    enhancedBytes = await enhanceImageBytes(originalBytes);
  } catch {
    return null;
  }

  const [storedOriginal, storedEnhanced] = await Promise.all([
    uploadProductImage(originalBytes, slug, "original"),
    uploadProductImage(enhancedBytes, slug, "enhanced"),
  ]);

  if (storedEnhanced) {
    return {
      imageUrl: storedOriginal ?? sourceUrl,
      enhancedImageUrl: storedEnhanced,
    };
  }

  return {
    imageUrl: sourceUrl,
    enhancedImageUrl: sourceUrl,
  };
}
