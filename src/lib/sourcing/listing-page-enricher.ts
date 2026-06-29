import "server-only";

import {
  isPollutedListingCopy,
  sanitizeHighlightBullets,
  sanitizeListingCopy,
} from "@/lib/sourcing/listing-copy-sanitizer";
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

const JINA_READER = "https://r.jina.ai/";
const USER_AGENT = "Mozilla/5.0 (compatible; AlmostAnythingBot/1.0)";

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

  const fallback = `${title} sourced from a South African supplier listing with fast local fulfilment.`;
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
    if (/\/128\/128\/|\/36\/36\/|\/42\/42\/|\/100\/100\//.test(url)) continue;
    if (!url.includes("rukmini") && !url.includes("/asset/") && !url.includes("faithful-to-nature")) {
      continue;
    }

    let score = 0;
    const dim = url.match(/\/fccp\/(\d+)\/(\d+)\//);
    if (dim) score += Number(dim[1]) + Number(dim[2]);
    if (/air-fryer|product|original/i.test(url)) score += 50;
    if (titleToken && alt.toLowerCase().includes(titleToken)) score += 200;
    if (alt.length > 12 && !/makro|easy 14-day/i.test(alt)) score += 60;
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
  const copy = parseDefaultDescription(markdown, title);

  if (!title || title.length < 4) return null;
  if (!priceZar) return null;

  return {
    title,
    priceZar,
    imageUrl,
    description: copy.description,
    summary: copy.summary,
    highlights: copy.highlights,
  };
}

export async function enrichListingFromUrl(url: string): Promise<EnrichedListing | null> {
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
