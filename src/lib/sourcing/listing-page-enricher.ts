import "server-only";

import {
  isPollutedListingCopy,
  sanitizeHighlightBullets,
  sanitizeListingCopy,
} from "@/lib/sourcing/listing-copy-sanitizer";
import { isJunkProductTitle } from "@/lib/sourcing/wholesale-supplier-url";
import { parseFaithfulToNatureMarkdown } from "@/lib/sourcing/listing-parsers/faithful-to-nature";
import {
  buildDescriptionFromBullets,
  cleanListingText,
  parsePricesFromMarkdown,
  parseTitleFromMarkdown,
  pickListingPrice,
  upgradeProductImageUrl,
} from "@/lib/sourcing/listing-parsers/shared";
import { isTakealotUrl, parseTakealotMarkdown } from "@/lib/sourcing/listing-parsers/takealot";
import {
  extractStructuredData,
  validateImageUrl,
} from "@/lib/sourcing/advanced/structured-data-extractor";

const JINA_READER = "https://r.jina.ai/";
const USER_AGENT = "Mozilla/5.0 (compatible; AlmostAnythingBot/1.0)";

import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";

import type { EnrichedListing } from "@/lib/sourcing/listing-parsers/types";

export type { EnrichedListing };

function isFaithfulToNatureUrl(url: string): boolean {
  return /faithful-to-nature\.co\.za/i.test(url);
}

function parseProductInformationBullets(markdown: string): string[] {
  const section = markdown.match(
    /(?:^|\n)Product Information\s*\n+([\s\S]*?)(?:\n+!\[Image|\n+Sold By|\n+Similar Products|\n+Warranty|$)/i,
  );
  if (!section?.[1]) return [];

  const bullets: string[] = [];
  for (const match of section[1].matchAll(/^\*\s+(.+)$/gm)) {
    const line = cleanListingText(match[1]);
    if (line.length > 8) bullets.push(line);
  }
  return bullets;
}

function parseDefaultDescription(
  markdown: string,
  title: string,
): { description: string; summary: string; highlights: string[] } {
  const section = markdown.match(
    /(?:^|\n)Description\s*\n+([\s\S]*?)(?:\n+Read More|\n+!\[Image|\n+Sold By|\n+Suggested Products|\n+Reviews|\n+Warranty|$)/i,
  );
  const raw = section?.[1] ? cleanListingText(section[1]) : "";

  const bullets = raw
    .split(
      /\s*[•\u2022]\s*|\s+-\s+(?=[A-Z])|(?<=[a-z])\s+(?=(?:Dual[- ]|Match[- ]|Easy,|Large \d|One[- ]touch|Non[- ]stick|Perfect for |Experience |Built[- ]in |Includes ))/,
    )
    .map((part) => cleanListingText(part))
    .filter((part) => part.length > 15);

  if (bullets.length) {
    const fullDescription = sanitizeListingCopy(bullets.join(" "), 500);
    return {
      description: fullDescription,
      summary: bullets[0].slice(0, 140),
      highlights: sanitizeHighlightBullets(bullets),
    };
  }

  if (raw.length > 40 && !isPollutedListingCopy(raw)) {
    return {
      description: sanitizeListingCopy(raw, 320),
      summary: raw.slice(0, 140),
      highlights: [],
    };
  }

  const infoBullets = sanitizeHighlightBullets(parseProductInformationBullets(markdown));
  if (infoBullets.length) {
    const description = buildDescriptionFromBullets(title, infoBullets);
    return {
      description: sanitizeListingCopy(description, 420),
      summary: description.slice(0, 140),
      highlights: infoBullets,
    };
  }

  const fallback = `${title}. Available to order with local fulfilment.`;
  return { description: fallback, summary: fallback.slice(0, 140), highlights: [] };
}

function parseImageFromMarkdown(
  markdown: string,
  pageUrl: string,
  title?: string,
): string | undefined {
  const hero = markdown.split(/\nDescription\n/i)[0] ?? markdown.slice(0, 8000);
  const candidates: { url: string; score: number }[] = [];
  const titleToken = title?.split(/\s+/)[0]?.toLowerCase() ?? "";

  for (const match of hero.matchAll(/!\[([^\]]*)\]\((https:\/\/[^)]+)\)/gi)) {
    const alt = match[1];
    const url = match[2];
    if (/logo|favicon|icon|cart|truck|banner|return|seller|\.svg/i.test(url)) continue;
    if (!/jpe?g|png|webp/i.test(url)) continue;
    if (/\/(?:128|36|42|100)\/(?:128|36|42|100)\//.test(url)) continue;

    let score = 40;
    if (/rukmini|cdn\.shopify|woocommerce|wp-content\/uploads|cloudfront|alicdn|media-amazon/i.test(url)) {
      score += 80;
    }
    if (/\/asset\/|faithful-to-nature|product/i.test(url)) score += 40;
    const dim = url.match(/\/fccp\/(\d+)\/(\d+)\//);
    if (dim) score += Number(dim[1]) + Number(dim[2]);
    if (titleToken && alt.toLowerCase().includes(titleToken)) score += 120;
    if (alt.length > 12 && !/makro|easy 14-day/i.test(alt)) score += 30;
    candidates.push({ url: upgradeProductImageUrl(url), score });
  }

  if (candidates.length) {
    return candidates.sort((a, b) => b.score - a.score)[0]?.url;
  }

  return undefined;
}

export function parseListingMarkdown(markdown: string, pageUrl: string): EnrichedListing | null {
  if (isTakealotUrl(pageUrl)) {
    const takealot = parseTakealotMarkdown(markdown);
    if (takealot) return takealot;
  }

  if (isFaithfulToNatureUrl(pageUrl)) {
    const ftn = parseFaithfulToNatureMarkdown(markdown);
    if (ftn) return ftn;
  }

  const title = parseTitleFromMarkdown(markdown);
  const priceZar = pickListingPrice(parsePricesFromMarkdown(markdown));
  const imageUrl = parseImageFromMarkdown(markdown, pageUrl, title);

  if (!title || title.length < 4 || isJunkProductTitle(title)) return null;
  if (!priceZar) return null;

  const copy = parseDefaultDescription(markdown, title);

  return {
    title,
    priceZar,
    imageUrl,
    description: copy.description,
    summary: copy.summary,
    highlights: copy.highlights,
  };
}

async function fetchListingHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(9000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

async function enrichFromStructuredHtml(html: string): Promise<EnrichedListing | null> {
  const structured = extractStructuredData(html);
  if (!structured.title || structured.price === null) return null;

  let imageUrl: string | null | undefined = structured.imageUrl;
  if (imageUrl) {
    const imageOk = await validateImageUrl(imageUrl);
    if (!imageOk) imageUrl = undefined;
  }

  const title = structured.title.trim();
  if (!title || title.length < 4 || isJunkProductTitle(title)) return null;

  const rate =
    structured.currency && structured.currency !== "ZAR"
      ? structured.currency === "USD"
        ? ZAR_PER_USD
        : 1
      : 1;
  const priceZar = Math.round(structured.price * rate * 100) / 100;
  if (!priceZar) return null;

  const description =
    structured.description?.trim() ||
    `${title}. Available to order with verified supplier pricing.`;

  return {
    title,
    priceZar,
    imageUrl: imageUrl ?? undefined,
    description,
    summary: description.slice(0, 140),
    highlights: [],
  };
}

export async function enrichListingFromUrl(url: string): Promise<EnrichedListing | null> {
  const html = await fetchListingHtml(url);
  if (html) {
    const structured = await enrichFromStructuredHtml(html);
    if (structured) return structured;
  }

  try {
    const res = await fetch(`${JINA_READER}${url}`, {
      headers: { Accept: "text/plain", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(18000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const markdown = await res.text();
    if (/429|CAPTCHA|captcha|Too Many Requests/i.test(markdown)) return null;
    return parseListingMarkdown(markdown, url);
  } catch {
    return null;
  }
}

export async function enrichListingsBatch(
  urls: string[],
  limit = 8,
): Promise<Map<string, EnrichedListing>> {
  const unique = [...new Set(urls)].slice(0, limit);
  const map = new Map<string, EnrichedListing>();

  for (let i = 0; i < unique.length; i += 2) {
    const batch = unique.slice(i, i + 2);
    const results = await Promise.all(
      batch.map(async (url) => ({ url, data: await enrichListingFromUrl(url) })),
    );
    for (const { url, data } of results) {
      if (data) map.set(url, data);
    }
  }

  return map;
}
