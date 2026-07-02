import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";
import { extractUnitPriceZarFromText } from "@/lib/pricing/wholesale-price-quote";
import type { VatStatus } from "@/lib/pricing/wholesale-price-quote";
import { materialMatchBoost } from "@/lib/sourcing/product-attribute-validator";
import { queryRelevanceScore } from "@/lib/sourcing/query-relevance";
import {
  type SearchTier,
  SA_B2B_DISTRIBUTOR_DOMAINS,
  WHOLESALE_DOMAINS,
} from "@/lib/sourcing/wholesale-supplier-constants";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

export function extractPrices(
  text: string,
  query?: string,
): { usd?: number; zar?: number; moq?: number; vatStatus?: VatStatus } {
  const quote = extractUnitPriceZarFromText(text, query);
  if (quote.zar) {
    return {
      zar: quote.zar,
      usd: quote.zar / ZAR_PER_USD,
      moq: quote.moq,
      vatStatus: quote.vatStatus,
    };
  }

  const withoutDims = text
    .replace(/\d+(?:\.\d+)?\s*(?:inch|inches|"|mm|cm|gb|tb)\b/gi, " ")
    .replace(/\bM[1-9]\b/gi, " ");

  const rangeMatch = withoutDims.match(
    /(?:US\$|\$\s*)([\d,]+(?:\.\d{1,2})?)\s*[-–]\s*(?:US\$|\$)?([\d,]+(?:\.\d{1,2})?)/i,
  );
  const usdMatch =
    rangeMatch ??
    withoutDims.match(
      /(?:US\$|\$\s*|USD\s*)([\d,]+(?:\.\d{1,2})?)(?:\s*[-–]\s*(?:US\$|\$)?([\d,]+(?:\.\d{1,2})?))?/i,
    );
  const zarMatch = withoutDims.match(/R\s*([\d,]+(?:\.\d{1,2})?)|ZAR\s*([\d,]+(?:\.\d{1,2})?)/i);
  const parse = (m: RegExpMatchArray | null) => {
    if (!m) return undefined;
    const low = Number((m[1] ?? "").replace(/,/g, ""));
    const high = m[2] ? Number(m[2].replace(/,/g, "")) : undefined;
    const n = Number.isFinite(high) ? Math.min(low, high!) : low;
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const usd = parse(usdMatch);
  const zar = parse(zarMatch);
  return {
    usd,
    zar: zar ?? (usd ? Math.round(usd * ZAR_PER_USD * 100) / 100 : undefined),
  };
}

export function scoreHit(
  hit: Omit<WholesaleSearchHit, "score">,
  tier: SearchTier,
  query: string,
): number {
  let score = hit.estimatedPriceZar ? 1000 / hit.estimatedPriceZar : 50;
  if (tier.region === "south_africa") score += 120;
  if (SA_B2B_DISTRIBUTOR_DOMAINS.some((d) => hit.domain.includes(d))) score += 80;
  if (tier.tier === "manufacturer") score += 40;
  if (tier.tier === "wholesale") score += 30;
  if (hit.tier === "retail") score -= 500;
  if (WHOLESALE_DOMAINS.some((d) => hit.domain.includes(d))) score += 35;
  if (hit.snippet.toLowerCase().includes("moq") || hit.snippet.toLowerCase().includes("wholesale")) {
    score += 15;
  }
  score += materialMatchBoost(query, hit.title, hit.snippet);
  score += queryRelevanceScore(query, hit.title, hit.snippet, hit.url);
  return score;
}
