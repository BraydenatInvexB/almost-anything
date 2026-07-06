/** Parse all product image URLs: primary `image_url` first, then `metadata.gallery`. */
export function parseProductGallery(
  metadata: unknown,
  primaryUrl?: string | null,
): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  function add(url: string | null | undefined) {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    urls.push(trimmed);
  }

  add(primaryUrl);

  if (metadata && typeof metadata === "object") {
    const gallery = (metadata as Record<string, unknown>).gallery;
    if (Array.isArray(gallery)) {
      for (const item of gallery) {
        if (typeof item === "string") add(item);
      }
    }
  }

  return urls;
}

/** Split ordered URLs into primary image + additional gallery entries. */
export function splitProductGallery(urls: string[]): {
  image_url: string | null;
  gallery: string[];
} {
  const cleaned = urls.map((u) => u.trim()).filter(Boolean);
  if (!cleaned.length) return { image_url: null, gallery: [] };
  return { image_url: cleaned[0], gallery: cleaned.slice(1) };
}
