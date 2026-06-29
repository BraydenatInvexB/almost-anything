/** Detect scraped page noise (reviews, related products, footers) in product copy. */
const POLLUTION_MARKERS = [
  /suggested products/i,
  /reviews\s+reviews/i,
  /overall rating/i,
  /would recommend this product/i,
  /faithful to nature is an online retail store/i,
  /javascript:void/i,
  /add to basket/i,
  /download our app/i,
  /let'?s get social/i,
  /work for us/i,
  /!\[image\s+\d+:/i,
  /write a review/i,
  /b corp certified/i,
  /paia manual/i,
];

const PRODUCT_ZONE_STOPS = [
  /\n\[Do you have a question\]/i,
  /\nSuggested Products/i,
  /\nReviews\b/i,
  /\nPlease Note:/i,
  /\n### About Us/i,
  /\n#### \[About Us\]/i,
  /\n##### Here'?s a handy guide/i,
];

export function isPollutedListingCopy(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (t.length > 2800) return true;

  let hits = 0;
  for (const re of POLLUTION_MARKERS) {
    if (re.test(t)) hits += 1;
  }
  return hits >= 2 || (hits >= 1 && t.length > 600);
}

export function clipProductPageMarkdown(markdown: string): string {
  let zone = markdown;
  for (const stop of PRODUCT_ZONE_STOPS) {
    const idx = zone.search(stop);
    if (idx > 80) zone = zone.slice(0, idx);
  }
  return zone;
}

export function sanitizeListingCopy(text: string, maxLength = 600): string {
  const trimmed = text.trim();
  if (!trimmed || isPollutedListingCopy(trimmed)) {
    const clipped = clipProductPageMarkdown(trimmed);
    if (clipped.length < trimmed.length && clipped.length > 20) {
      return clipped.slice(0, maxLength).trim();
    }
    return "";
  }
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength).trim()}…` : trimmed;
}

export function sanitizeHighlightBullets(bullets: string[]): string[] {
  const out: string[] = [];
  for (const raw of bullets) {
    const item = sanitizeListingCopy(raw, 220);
    if (!item || isPollutedListingCopy(item)) continue;
    if (item.length < 4) continue;
    out.push(item);
  }
  return out.filter((value, index, array) => array.indexOf(value) === index);
}
