/** URL helpers for product images — safe to import anywhere (no Node-only deps). */

const STOCK_HOSTS = ["images.unsplash.com", "placeholder.com", "placehold.co"];

/** Hosts configured in next.config — use next/image. Supplier listing URLs use native `<img>`. */
const NEXT_IMAGE_HOST_SUFFIXES = [
  "images.unsplash.com",
  "supabase.co",
  "media-amazon.com",
  "takealot.com",
  "alicdn.com",
  "shopify.com",
  "wp.com",
  "googleusercontent.com",
  "fbsbx.com",
  "fbcdn.net",
];

export function shouldUseNextImage(src: string): boolean {
  try {
    const host = new URL(src).hostname.toLowerCase();
    return NEXT_IMAGE_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    return false;
  }
}

export function isStockPlaceholderUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return STOCK_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export function isInvalidProductImageUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  if (isStockPlaceholderUrl(url)) return true;
  const lower = url.toLowerCase();
  if (lower.includes("sprite") || lower.includes("/gno/") || lower.includes("nav-")) {
    return true;
  }
  if (lower.includes("media-amazon.com") && !/\/images\/I\//i.test(lower)) {
    return true;
  }
  return false;
}
