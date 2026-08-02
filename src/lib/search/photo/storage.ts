import { PHOTO_STORAGE_KEY } from "./constants";
import type { StoredSearchPhoto } from "./types";

export function storeSearchPhoto(photo: StoredSearchPhoto) {
  try {
    sessionStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photo));
  } catch {
    // Quota exceeded — drop the photo rather than blocking search.
    sessionStorage.removeItem(PHOTO_STORAGE_KEY);
  }
}

export function readSearchPhoto(): StoredSearchPhoto | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PHOTO_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSearchPhoto;
  } catch {
    return null;
  }
}

export function clearSearchPhoto() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PHOTO_STORAGE_KEY);
}
