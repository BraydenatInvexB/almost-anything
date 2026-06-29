import "server-only";

/**
 * Scrape product photos from supplier listing pages.
 */

const USER_AGENT =
  "Mozilla/5.0 (compatible; AlmostAnythingBot/1.0; +https://almostanything.store)";

const STOCK_HOSTS = ["images.unsplash.com", "placeholder.com", "placehold.co", "via.placeholder.com"];

const BRANDED_PATH = /logo|watermark|badge|seller|storefront|banner|brand|avatar|icon|favicon/i;

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function isStockImageUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return STOCK_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return true;
  }
}

function supplierBrandTokens(supplierName: string): string[] {
  return supplierName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3);
}

/** Skip images that likely show the seller's branding in the file path. */
export function isLikelyBrandedImage(url: string, supplierName: string): boolean {
  const lower = url.toLowerCase();
  if (BRANDED_PATH.test(lower)) return true;

  const slug = supplierName.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (slug.length > 4 && lower.includes(slug)) return true;

  return supplierBrandTokens(supplierName).some((token) => lower.includes(token));
}

function toAbsoluteUrl(raw: string, pageUrl: string): string | null {
  try {
    if (raw.startsWith("//")) return `https:${raw}`;
    if (raw.startsWith("/")) return new URL(raw, pageUrl).toString();
    if (isHttpUrl(raw)) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

function extractMetaImages(html: string, pageUrl: string): string[] {
  const found: string[] = [];
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/gi,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/gi,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const abs = toAbsoluteUrl(match[1], pageUrl);
      if (abs) found.push(abs);
    }
  }

  return found;
}

function extractJsonLdImages(html: string, pageUrl: string): string[] {
  const found: string[] = [];
  const blocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (!blocks) return found;

  for (const block of blocks) {
    const jsonText = block.replace(/<script[^>]*>|<\/script>/gi, "").trim();
    try {
      const data = JSON.parse(jsonText) as unknown;
      collectJsonImages(data, pageUrl, found);
    } catch {
      /* skip invalid JSON-LD */
    }
  }

  return found;
}

function collectJsonImages(node: unknown, pageUrl: string, out: string[]): void {
  if (!node) return;
  if (typeof node === "string") {
    const abs = toAbsoluteUrl(node, pageUrl);
    if (abs) out.push(abs);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item) => collectJsonImages(item, pageUrl, out));
    return;
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (obj.image) collectJsonImages(obj.image, pageUrl, out);
    if (obj["@graph"]) collectJsonImages(obj["@graph"], pageUrl, out);
  }
}

function extractImgTags(html: string, pageUrl: string): string[] {
  const found: string[] = [];
  const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = imgPattern.exec(html)) !== null) {
    const abs = toAbsoluteUrl(match[1], pageUrl);
    if (!abs) continue;
    const lower = abs.toLowerCase();
    if (lower.endsWith(".svg") || lower.includes("sprite") || lower.includes("pixel")) continue;
    if (/\b(logo|icon|avatar|badge|banner)\b/i.test(lower)) continue;
    found.push(abs);
  }

  return found;
}

export function scoreImageCandidate(url: string): number {
  let score = 0;
  const lower = url.toLowerCase();
  if (/media-amazon|alicdn|shopify|ebayimg|made-in-china|globalsources/.test(lower)) {
    score += 6;
  }
  if (/product|item|goods|catalog|listing|sku|main|hero|large|1200|1000|800|_xl|_lg/.test(lower)) {
    score += 3;
  }
  if (/thumb|small|mini|icon|50x|64x|100x|150x|200x|thf\.bing\.com\/th\//.test(lower)) {
    score -= 6;
  }
  if (/banner|hero-wide|strip|sprite|nav-|footer|header|promo|ad-/.test(lower)) score -= 5;
  if (/_\d{2,3}x\d{2,3}\b/.test(lower)) {
    const dim = lower.match(/_(\d{2,3})x(\d{2,3})\b/);
    if (dim) {
      const w = Number(dim[1]);
      const h = Number(dim[2]);
      if (w > 0 && h > 0) {
        const aspect = w / h;
        if (aspect > 2.5 || aspect < 0.4) score -= 8;
        if (Math.min(w, h) < 200) score -= 5;
      }
    }
  }
  if (lower.includes("webp") || lower.includes("jpg") || lower.includes("jpeg") || lower.includes("png")) {
    score += 1;
  }
  return score;
}

export async function scrapeListingImages(pageUrl: string): Promise<string[]> {
  if (!isHttpUrl(pageUrl)) return [];
  if (pageUrl.includes("almostanything.store/sourced")) return [];

  try {
    const res = await fetch(pageUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!res.ok) return [];

    const html = await res.text();
    const candidates = [
      ...extractMetaImages(html, pageUrl),
      ...extractJsonLdImages(html, pageUrl),
      ...extractImgTags(html, pageUrl),
    ];

    return [...new Set(candidates)];
  } catch {
    return [];
  }
}

export async function collectSourceImageCandidates(input: {
  supplierUrl: string;
  supplierName: string;
  candidateUrl?: string;
}): Promise<string[]> {
  const scraped = await scrapeListingImages(input.supplierUrl);
  const direct = input.candidateUrl ? [input.candidateUrl] : [];
  const candidates = [...new Set([...direct, ...scraped])];

  return candidates.filter(
    (url) =>
      isHttpUrl(url) &&
      !isStockImageUrl(url) &&
      !isLikelyBrandedImage(url, input.supplierName) &&
      !(url.includes("media-amazon.com") && !/\/images\/I\//i.test(url)),
  );
}
