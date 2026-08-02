import { MAX_DIMENSION, MAX_INPUT_BYTES, TARGET_DATA_URL_CHARS } from "./constants";

function fitWithin(width: number, height: number, maxEdge: number) {
  if (width <= maxEdge && height <= maxEdge) {
    return { width, height };
  }
  const scale = maxEdge / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function drawToJpegDataUrl(
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
  quality: number,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Couldn't process that photo.");
  }
  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Reads an image file and returns a JPEG data URL sized for sessionStorage + search.
 * Large phone photos are resized/compressed instead of rejected.
 */
export async function readImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Photo is too large — try a smaller image (under 25 MB).");
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Couldn't read that photo. Try a JPG or PNG.");
  }

  try {
    let edge = MAX_DIMENSION;
    let { width, height } = fitWithin(bitmap.width, bitmap.height, edge);
    let quality = 0.82;
    let dataUrl = drawToJpegDataUrl(bitmap, width, height, quality);

    // Prefer dropping quality first, then shrink dimensions if still oversized.
    while (dataUrl.length > TARGET_DATA_URL_CHARS && quality > 0.45) {
      quality -= 0.1;
      dataUrl = drawToJpegDataUrl(bitmap, width, height, quality);
    }

    while (dataUrl.length > TARGET_DATA_URL_CHARS && edge > 480) {
      edge = Math.round(edge * 0.75);
      ({ width, height } = fitWithin(bitmap.width, bitmap.height, edge));
      quality = Math.max(0.5, quality);
      dataUrl = drawToJpegDataUrl(bitmap, width, height, quality);
    }

    if (dataUrl.length > TARGET_DATA_URL_CHARS) {
      throw new Error("Couldn't shrink that photo enough — try a simpler image.");
    }

    return dataUrl;
  } finally {
    bitmap.close();
  }
}
