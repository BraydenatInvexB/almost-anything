import "server-only";

/**
 * Find product photos — SA listings first, international wholesale next,
 * SA retail pages last (photos only, not used for pricing).
 */

import { SA_IMAGE_ONLY_DOMAINS } from "@/lib/sourcing/wholesale-supplier-search";
import {
  isLikelyBrandedImage,
  scoreImageCandidate,
  scrapeListingImages,
} from "@/lib/sourcing/source-image-scraper";

const JINA_READER = "https://r.jina.ai/";
const USER_AGENT = "Mozilla/5.0 (compatible; AlmostAnythingBot/1.0)";

const BLOCKED_PRICING_RETAIL = ["amazon.", "ebay.com"];

const WHOLESALE_SEARCHERS = [
  (q: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(`site:.co.za ${q} product`)}`,
  (q: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(`${q} South Africa shop product image`)}`,
  (q: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(`${q} wholesale supplier product image trade`)}`,
  (q: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(`site:alibaba.com ${q} product`)}`,
];

const SA_IMAGE_SEARCHERS = [
  (q: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(`site:takealot.com ${q}`)}`,
  (q: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(`site:dischem.co.za ${q}`)}`,
  (q: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(`site:clicks.co.za ${q}`)}`,
  (q: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(`site:faithful-to-nature.co.za ${q}`)}`,
];

const LISTING_HOST_HINTS = [
  ".co.za",
  "dischem.co.za",
  "clicks.co.za",
  "faithful-to-nature.co.za",
  "takealot.com",
  "alibaba.com",
  "1688.com",
  "made-in-china.com",
  "globalsources.com",
  "dhgate.com",
];

async function fetchListingMarkdown(targetUrl: string): Promise<string> {
  try {
    const res = await fetch(`${JINA_READER}${targetUrl}`, {
      headers: { Accept: "text/plain", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

function extractMarkdownLinks(markdown: string): string[] {
  const links: string[] = [];
  const pattern = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(markdown)) !== null) {
    links.push(match[2]);
  }
  return links;
}

function extractMarkdownImages(markdown: string): string[] {
  const images: string[] = [];
  const pattern = /!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(markdown)) !== null) {
    images.push(match[1]);
  }
  return images;
}

function isBlockedPricingRetail(url: string): boolean {
  const lower = url.toLowerCase();
  return BLOCKED_PRICING_RETAIL.some((d) => lower.includes(d));
}

function isSaImageSource(url: string): boolean {
  const lower = url.toLowerCase();
  return SA_IMAGE_ONLY_DOMAINS.some((d) => lower.includes(d)) || lower.endsWith(".co.za");
}

function isUsableProductImage(url: string, supplierName: string): boolean {
  const lower = url.toLowerCase();
  if (isLikelyBrandedImage(url, supplierName)) return false;
  if (lower.includes("sprite") || lower.includes("/gno/") || lower.includes("nav-")) return false;
  if (lower.includes("media-amazon.com") && !/\/images\/I\//i.test(lower)) return false;
  return /\.(jpg|jpeg|png|webp)(\?|$)/i.test(lower) || lower.includes("alicdn.com");
}

function pickBestListingUrl(
  links: string[],
  productName: string,
  preferSa: boolean,
): string | null {
  const nameTokens = productName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3);

  const productLinks = links.filter((url) => {
    const lower = url.toLowerCase();
    if (isBlockedPricingRetail(url)) return false;
    return (
      LISTING_HOST_HINTS.some((h) => lower.includes(h)) ||
      lower.includes("/product") ||
      lower.includes("/p/")
    );
  });

  if (!productLinks.length) return null;

  const scored = productLinks.map((url) => {
    const lower = url.toLowerCase();
    let score = 0;
    for (const token of nameTokens) {
      if (lower.includes(token)) score += 2;
    }
    if (lower.endsWith(".co.za") || isSaImageSource(url)) score += 8;
    if (lower.includes("dischem") || lower.includes("clicks")) score += 6;
    if (lower.includes("alibaba.com") || lower.includes("made-in-china")) score += 3;
    if (preferSa && !isSaImageSource(url)) score -= 4;
    return { url, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.url ?? null;
}

function pickBestImageUrl(images: string[], supplierName: string): string | null {
  const usable = images.filter((url) => isUsableProductImage(url, supplierName));
  usable.sort((a, b) => scoreImageCandidate(b) - scoreImageCandidate(a));
  return usable[0] ?? null;
}

async function trySearchers(
  searchers: Array<(q: string) => string>,
  query: string,
  productName: string,
  supplierName: string,
  preferSa: boolean,
): Promise<{ imageUrl: string; listingUrl: string } | null> {
  for (const buildSearchUrl of searchers) {
    const searchUrl = buildSearchUrl(query || productName);
    const searchMarkdown = await fetchListingMarkdown(searchUrl);
    if (!searchMarkdown) continue;

    const listingUrl = pickBestListingUrl(
      extractMarkdownLinks(searchMarkdown),
      productName,
      preferSa,
    );
    if (!listingUrl) continue;

    const scraped = await scrapeListingImages(listingUrl);
    const listingMarkdown = await fetchListingMarkdown(listingUrl);
    const imageUrl = pickBestImageUrl(
      [
        ...scraped,
        ...extractMarkdownImages(listingMarkdown),
        ...extractMarkdownLinks(listingMarkdown).filter((u) => u.match(/\.(jpg|jpeg|png|webp)/i)),
      ],
      supplierName,
    );

    if (imageUrl) return { imageUrl, listingUrl };
  }
  return null;
}

export type MarketplaceImageResult = {
  imageUrl: string;
  listingUrl: string;
};

export async function findMarketplaceListingImage(
  query: string,
  productName: string,
  supplierName: string,
  preferredListingUrl?: string,
): Promise<MarketplaceImageResult | null> {
  if (preferredListingUrl && !isBlockedPricingRetail(preferredListingUrl)) {
    const scraped = await scrapeListingImages(preferredListingUrl);
    const image = pickBestImageUrl(scraped, supplierName);
    if (image) return { imageUrl: image, listingUrl: preferredListingUrl };
  }

  const wholesale = await trySearchers(
    WHOLESALE_SEARCHERS,
    query,
    productName,
    supplierName,
    true,
  );
  if (wholesale) return wholesale;

  return trySearchers(SA_IMAGE_SEARCHERS, query, productName, supplierName, true);
}
