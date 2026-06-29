import {
  clipProductPageMarkdown,
  sanitizeHighlightBullets,
  sanitizeListingCopy,
} from "@/lib/sourcing/listing-copy-sanitizer";
import type { EnrichedListing } from "@/lib/sourcing/listing-parsers/types";
import {
  buildDescriptionFromBullets,
  cleanListingText,
  parsePricesFromMarkdown,
  pickListingPrice,
} from "@/lib/sourcing/listing-parsers/shared";

function parseFtnTitle(markdown: string): string {
  const h1 = markdown.match(/^#\s+([^\n]+)/m);
  const titleLine = markdown.match(/^Title:\s*([^|\n]+)/m);
  return cleanListingText((h1?.[1] ?? titleLine?.[1] ?? "").trim());
}

function parseFtnImage(markdown: string): string | undefined {
  for (const match of markdown.matchAll(
    /!\[[^\]]*\]\((https:\/\/www\.faithful-to-nature\.co\.za\/media\/catalog\/product\/[^)]+\.(?:jpe?g|png|webp)[^)]*)\)/gi,
  )) {
    const url = match[1].replace(/\/small_image\/\d+x[^/]+\//, "/image/");
    if (!/small_image|135x/i.test(url)) return url;
  }
  return undefined;
}

function parseStarBullets(zone: string): string[] {
  const bullets: string[] = [];
  for (const match of zone.matchAll(/^\*\s+(.+)$/gm)) {
    const line = cleanListingText(match[1].replace(/\*\*/g, ""));
    if (line.length < 4) continue;
    if (/^R\s*\d/.test(line)) continue;
    if (/^place the adhesive/i.test(line)) continue;
    bullets.push(line);
  }
  return bullets;
}

function parseFtnSections(zone: string): Record<string, string> {
  const specs: Record<string, string> = {};
  const sectionPattern = /\*\*([^*]+):\*\*\s*\n?([\s\S]*?)(?=\n\*\*[^*]+:\*\*|\n\[|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = sectionPattern.exec(zone)) !== null) {
    const key = cleanListingText(match[1]);
    const body = match[2]
      .split(/\n/)
      .map((line) => line.replace(/^\*\s+/, "").trim())
      .filter(Boolean)
      .join("; ");
    if (key && body) specs[key] = cleanListingText(body).slice(0, 200);
  }
  return specs;
}

export function parseFaithfulToNatureMarkdown(markdown: string): EnrichedListing | null {
  const title = parseFtnTitle(markdown);
  if (!title || title.length < 3) return null;

  let priceZar = pickListingPrice(parsePricesFromMarkdown(markdown));
  if (!priceZar) {
    const nearTitle = markdown.match(/^#\s+[^\n]+\n+R\s*([\d,]+(?:\.\d{2})?)/m);
    if (nearTitle) {
      const n = Number(nearTitle[1].replace(/,/g, ""));
      if (Number.isFinite(n) && n >= 5) priceZar = n;
    }
  }
  if (!priceZar) return null;

  const zone = clipProductPageMarkdown(markdown);
  const bullets = sanitizeHighlightBullets(parseStarBullets(zone));
  const sections = parseFtnSections(zone);

  const description = sanitizeListingCopy(
    buildDescriptionFromBullets(title, bullets) ||
      `${title}. ${Object.values(sections).slice(0, 2).join(". ")}.`,
    420,
  );

  const highlights = bullets.slice(0, 10);
  if (!highlights.length && sections.Specifications) {
    highlights.push(sections.Specifications);
  }

  return {
    title,
    priceZar,
    imageUrl: parseFtnImage(markdown),
    description: description || `${title} from Faithful to Nature.`,
    summary: sanitizeListingCopy(description, 140) || title,
    highlights,
    specifications: sections,
  };
}
