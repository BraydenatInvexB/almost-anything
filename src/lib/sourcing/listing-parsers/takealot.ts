import { sanitizeHighlightBullets, sanitizeListingCopy } from "@/lib/sourcing/listing-copy-sanitizer";
import type { EnrichedListing } from "@/lib/sourcing/listing-parsers/types";
import { cleanListingText, parsePricesFromMarkdown, pickListingPrice } from "@/lib/sourcing/listing-parsers/shared";

export function isTakealotUrl(url: string): boolean {
  return /takealot\.com/i.test(url);
}

export function parseTakealotMarkdown(markdown: string): EnrichedListing | null {
  const h1 = markdown.match(/^#\s+([^\n]+)/m);
  const titleLine = markdown.match(/^Title:\s*([^|]+)/m);
  const title = cleanListingText((h1?.[1] ?? titleLine?.[1] ?? "").trim());
  if (!title || title.length < 3) return null;

  let priceZar: number | undefined;
  const nearTitle = markdown.match(/^#\s+[^\n]+\n+R\s*([\d,]+)/m);
  if (nearTitle) {
    const n = Number(nearTitle[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n >= 29) priceZar = n;
  }
  if (!priceZar) priceZar = pickListingPrice(parsePricesFromMarkdown(markdown));
  if (!priceZar) return null;

  const descSection = markdown.match(
    /## Description\s*\n+([\s\S]*?)(?:\n## |\n### |\n\*\*Cookie|\n# [A-Z]|$)/i,
  );
  const rawDesc = descSection?.[1] ? cleanListingText(descSection[1]) : "";

  let imageUrl: string | undefined;
  for (const match of markdown.matchAll(
    /!\[[^\]]*\]\((https:\/\/media\.takealot\.com\/[^)]+\.(?:jpe?g|png|webp)[^)]*)\)/gi,
  )) {
    imageUrl = match[1];
    if (/covers_tsins|xlpreview|zoom/.test(imageUrl)) break;
  }

  const description = sanitizeListingCopy(
    rawDesc.length > 40 ? rawDesc.slice(0, 500) : `${title} available from Takealot.`,
    500,
  );
  const highlights = sanitizeHighlightBullets(rawDesc.length > 40 ? [rawDesc.slice(0, 320)] : []);

  return {
    title,
    priceZar,
    imageUrl,
    description,
    summary: sanitizeListingCopy(rawDesc, 140) || title,
    highlights,
  };
}
