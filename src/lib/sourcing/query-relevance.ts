/** Stop words stripped when matching specific product searches (e.g. "lightlark book" → "lightlark"). */
import {
  extractCompoundSearchPhrases,
  productMatchesModelIntent,
} from "@/lib/catalog/product-model-match";
const SEARCH_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "with",
  "book",
  "books",
  "novel",
  "buy",
  "shop",
  "price",
  "new",
  "used",
  "south",
  "africa",
  "za",
  "by",
  "from",
  "of",
  "edition",
  "ed",
]);

export function significantSearchTokens(query: string): string[] {
  const compounds = extractCompoundSearchPhrases(query);
  let remainder = query.toLowerCase();
  for (const phrase of compounds) {
    remainder = remainder.replace(phrase, " ");
  }

  const rest = [
    ...new Set(
      remainder
        .split(/[^a-z0-9]+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2 && !SEARCH_STOP_WORDS.has(t)),
    ),
  ];

  return [...new Set([...compounds, ...rest])];
}

function slugFromUrl(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return "";
  }
}

/** Higher = closer match to what the shopper typed. */
export function queryRelevanceScore(
  query: string,
  title: string,
  snippet: string,
  url?: string,
): number {
  const q = query.trim().toLowerCase();
  const titleLower = title.toLowerCase();
  const snippetLower = snippet.toLowerCase();
  const slug = slugFromUrl(url ?? "");
  const tokens = significantSearchTokens(q);

  let score = 0;

  if (q.length >= 4 && titleLower.includes(q)) score += 250;
  if (q.length >= 4 && slug.includes(q.replace(/\s+/g, "-"))) score += 200;
  if (q.length >= 4 && slug.includes(q.replace(/\s+/g, ""))) score += 180;

  if (!tokens.length) {
    if (titleLower.includes(q)) score += 80;
    return score;
  }

  let titleHits = 0;
  let slugHits = 0;

  for (const token of tokens) {
    if (titleLower.includes(token)) {
      score += 55;
      titleHits += 1;
    }
    if (slug.includes(token)) {
      score += 40;
      slugHits += 1;
    }
    if (snippetLower.includes(token)) score += 8;
  }

  if (tokens.length >= 2 && titleHits === tokens.length) score += 120;
  if (tokens.length >= 1 && (titleHits > 0 || slugHits > 0)) score += 40;

  if (tokens.length >= 1 && titleHits === 0 && slugHits === 0) score -= 200;

  return score;
}

export function isRelevantProductHit(
  query: string,
  title: string,
  snippet: string,
  url?: string,
  minScore = 30,
): boolean {
  if (!productMatchesModelIntent(query, title, snippet)) return false;

  if (queryRelevanceScore(query, title, snippet, url) >= minScore) return true;

  const q = query.toLowerCase();
  if (/\bsolder/i.test(q)) {
    const blob = `${title} ${snippet}`.toLowerCase();
    if (blob.includes("solder") && /\b(gun|iron|station|pencil|wire)\b/.test(blob)) {
      return true;
    }
  }

  if (/\bpencil/i.test(q) && /\bcase\b/i.test(q)) {
    const blob = `${title} ${snippet}`.toLowerCase();
    if (/\bpencil\b/.test(blob) && /\b(case|pouch|bag|holder|box)\b/.test(blob)) {
      return true;
    }
  }

  return false;
}

export function rankHitsByRelevance<T extends { title: string; snippet: string; url: string; score: number; estimatedPriceZar?: number }>(
  hits: T[],
  query: string,
): T[] {
  return [...hits].sort((a, b) => {
    const relA = queryRelevanceScore(query, a.title, a.snippet, a.url);
    const relB = queryRelevanceScore(query, b.title, b.snippet, b.url);
    if (relB !== relA) return relB - relA;
    const priceA = a.estimatedPriceZar ?? Number.MAX_SAFE_INTEGER;
    const priceB = b.estimatedPriceZar ?? Number.MAX_SAFE_INTEGER;
    return priceA - priceB;
  });
}
