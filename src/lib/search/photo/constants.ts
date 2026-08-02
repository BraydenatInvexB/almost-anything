/** Original file size ceiling before we even try to decode (phone HEIC/JPEG dumps). */
export const MAX_INPUT_BYTES = 25 * 1024 * 1024;

/** Longest edge after resize — enough detail for search, small for sessionStorage. */
export const MAX_DIMENSION = 1280;

/**
 * Target size of the data-URL string in sessionStorage.
 * Quotas are typically ~5 MB total; keep headroom for other keys.
 */
export const TARGET_DATA_URL_CHARS = 1_200_000;

export const PHOTO_STORAGE_KEY = "aa_search_photo";
