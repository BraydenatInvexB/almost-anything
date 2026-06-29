/** URL helpers for product images — safe to import anywhere (no Node-only deps). */

const STOCK_HOSTS = ["images.unsplash.com", "placeholder.com", "placehold.co"];

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
