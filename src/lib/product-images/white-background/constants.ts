import "server-only";

/** Pure white catalog backdrop — RGB only (JPEG-safe). */
export const WHITE = { r: 255, g: 255, b: 255 } as const;

/** Longest edge after framing — keeps file size reasonable without cropping the product. */
export const MAX_EDGE = 1600;

/** JPEG quality for storefront uploads (no extra sharpen/colour grades). */
export const OUTPUT_JPEG_QUALITY = 92;
