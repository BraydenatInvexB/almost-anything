import "server-only";

/** Minimum width/height for a usable storefront product photo. */
export const MIN_PRODUCT_IMAGE_PX = 320;

/** Reject ultra-wide banners and ultra-tall strips. */
export const MIN_PRODUCT_ASPECT = 0.45;
export const MAX_PRODUCT_ASPECT = 2.2;

export type ImageDimensions = {
  width: number;
  height: number;
  aspect: number;
};

export function dimensionsFromMetadata(meta: {
  width?: number;
  height?: number;
}): ImageDimensions | null {
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < MIN_PRODUCT_IMAGE_PX || height < MIN_PRODUCT_IMAGE_PX) return null;
  return { width, height, aspect: width / height };
}

export function isUsableProductPhoto(dimensions: ImageDimensions): boolean {
  return (
    dimensions.aspect >= MIN_PRODUCT_ASPECT &&
    dimensions.aspect <= MAX_PRODUCT_ASPECT &&
    dimensions.width >= MIN_PRODUCT_IMAGE_PX &&
    dimensions.height >= MIN_PRODUCT_IMAGE_PX
  );
}

export function scoreProductPhotoDimensions(dimensions: ImageDimensions): number {
  let score = 0;
  const minSide = Math.min(dimensions.width, dimensions.height);
  const maxSide = Math.max(dimensions.width, dimensions.height);

  if (minSide >= 600) score += 8;
  else if (minSide >= 400) score += 4;

  if (maxSide >= 800) score += 3;

  const squareness = 1 - Math.abs(1 - dimensions.aspect);
  score += Math.round(squareness * 6);

  return score;
}

export async function readImageDimensions(bytes: Buffer): Promise<ImageDimensions | null> {
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(bytes).metadata();
    if (!meta.width || !meta.height) return null;
    return dimensionsFromMetadata(meta);
  } catch {
    return null;
  }
}

export async function validateProductImageBytes(
  bytes: Buffer,
  options?: { relaxed?: boolean },
): Promise<{
  ok: boolean;
  dimensions: ImageDimensions | null;
  score: number;
}> {
  const dimensions = await readImageDimensions(bytes);
  const minPx = options?.relaxed ? 200 : MIN_PRODUCT_IMAGE_PX;
  const minAspect = options?.relaxed ? 0.35 : MIN_PRODUCT_ASPECT;
  const maxAspect = options?.relaxed ? 2.5 : MAX_PRODUCT_ASPECT;

  if (!dimensions || dimensions.width < minPx || dimensions.height < minPx) {
    return { ok: false, dimensions, score: -1 };
  }
  if (dimensions.aspect < minAspect || dimensions.aspect > maxAspect) {
    return { ok: false, dimensions, score: -1 };
  }
  return { ok: true, dimensions, score: scoreProductPhotoDimensions(dimensions) };
}
