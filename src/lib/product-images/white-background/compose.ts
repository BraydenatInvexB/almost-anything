import "server-only";

import { MAX_EDGE, OUTPUT_JPEG_QUALITY, WHITE } from "./constants";

/**
 * Composite any RGBA (or RGB) image onto pure white.
 * Does not sharpen, recolour, or otherwise alter product pixels —
 * only replaces transparency / pads with white.
 */
export async function compositeOntoWhite(input: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const image = sharp(input).rotate();
  const meta = await image.metadata();

  const width = meta.width ?? MAX_EDGE;
  const height = meta.height ?? MAX_EDGE;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  return image
    .resize(targetW, targetH, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .ensureAlpha()
    .flatten({ background: WHITE })
    .jpeg({ quality: OUTPUT_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
}

/**
 * Fallback when AI removal is unavailable: keep every product pixel as-is
 * and place the photo on a white square canvas (letterbox / pillarbox).
 */
export async function frameOnWhite(input: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp(input)
    .rotate()
    .resize(MAX_EDGE, MAX_EDGE, {
      fit: "contain",
      background: { ...WHITE, alpha: 1 },
      withoutEnlargement: false,
    })
    .flatten({ background: WHITE })
    .jpeg({ quality: OUTPUT_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
}

export async function hasMeaningfulAlpha(input: Buffer): Promise<boolean> {
  const sharp = (await import("sharp")).default;
  const meta = await sharp(input).metadata();
  if (!meta.hasAlpha) return false;

  // Sample a tiny alpha channel — if any near-transparent pixels exist, treat as cutout.
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  if (channels < 4) return false;

  let transparentish = 0;
  const step = Math.max(1, Math.floor(data.length / (channels * 4000)));
  for (let i = 3; i < data.length; i += channels * step) {
    if (data[i]! < 250) transparentish += 1;
    if (transparentish > 8) return true;
  }
  return false;
}
