const PHOTO_STORAGE_KEY = "aa_search_photo";
const MAX_BYTES = 1_500_000;

export interface StoredSearchPhoto {
  dataUrl: string;
  name: string;
}

export function storeSearchPhoto(photo: StoredSearchPhoto) {
  sessionStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photo));
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
  sessionStorage.removeItem(PHOTO_STORAGE_KEY);
}

export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    if (file.size > MAX_BYTES) {
      reject(new Error("Photo is too large — use an image under 1.5 MB."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Couldn't read that photo."));
    reader.readAsDataURL(file);
  });
}
