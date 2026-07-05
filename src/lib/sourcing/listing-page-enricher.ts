import "server-only";

import { sanitizeListingCopy } from "@/lib/sourcing/listing-copy-sanitizer";
import { parseListingMarkdown } from "@/lib/sourcing/listing-markdown-parser";
import {
  parsePricesFromMarkdown,
  parseTitleFromMarkdown,
  pickListingPrice,
} from "@/lib/sourcing/listing-parsers/shared";
import {
  extractStructuredData,
  validateImageUrl,
} from "@/lib/sourcing/advanced/structured-data-extractor";
import { parseWholesalePriceQuote } from "@/lib/pricing/wholesale-price-quote";
import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";
import { isJunkProductTitle } from "@/lib/sourcing/wholesale-supplier-url";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";
import type { EnrichedListing } from "@/lib/sourcing/listing-parsers/types";

export type { EnrichedListing };

const JINA_READER = "https://r.jina.ai/";
const USER_AGENT = "Mozilla/5.0 (compatible; AlmostAnythingBot/1.0)";

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

/** Parse FOB/unit prices embedded in HTML when JSON-LD is missing (common on made-in-china.com). */
function parseListingFromHtml(html: string, pageUrl: string): EnrichedListing | null {
  const structured = extractStructuredData(html);
  const title =
    structured.title?.trim() ||
    parseTitleFromMarkdown(`Title: ${html.match(/<title[^>]*>([^<]+)/i)?.[1] ?? ""}`);
  if (!title || title.length < 4 || isJunkProductTitle(title)) return null;

  const priceQuote = parseWholesalePriceQuote(html);
  const priceZar =
    priceQuote?.unitPriceZarExVat ?? pickListingPrice(parsePricesFromMarkdown(html, title), html, title);
  if (!priceZar) return null;

  const description = structured.description?.trim() || `${title}. Available to order with local fulfilment.`;

  return {
    title,
    priceZar,
    imageUrl: structured.imageUrl ?? undefined,
    description: sanitizeListingCopy(description, 420),
    summary: description.slice(0, 140),
    highlights: [],
    supplierMoq: priceQuote?.minimumOrderQuantity,
    priceVatStatus: priceQuote?.vatStatus,
  };
}

export function mergeEnrichedListingIntoHit(hit: WholesaleSearchHit, data: EnrichedListing): void {
  hit.estimatedPriceZar = data.priceZar;
  if (data.supplierMoq && data.supplierMoq > 1) {
    hit.supplierMoq = data.supplierMoq;
  }
  if (data.priceVatStatus) {
    hit.priceVatStatus = data.priceVatStatus;
  }
}

export async function enrichListingFromUrl(url: string): Promise<EnrichedListing | null> {
  const html = await fetchListingHtml(url);
  if (html) {
    if (/made-in-china\.com/i.test(url)) {
      const micParsed = parseListingFromHtml(html, url);
      if (micParsed) return micParsed;
    }
    const structured = await enrichFromStructuredHtml(html);
    if (structured) return structured;
    const parsed = parseListingFromHtml(html, url);
    if (parsed) return parsed;
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
