import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";
import { materialMatchBoost } from "@/lib/sourcing/product-attribute-validator";
import { queryRelevanceScore } from "@/lib/sourcing/query-relevance";
import {
  type SearchTier,
  WHOLESALE_DOMAINS,
} from "@/lib/sourcing/wholesale-supplier-constants";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

export function extractPrices(text: string): { usd?: number; zar?: number } {
  const usdMatch = text.match(/\$\s*([\d,]+(?:\.\d{1,2})?)|USD\s*([\d,]+(?:\.\d{1,2})?)/i);
  const zarMatch = text.match(/R\s*([\d,]+(?:\.\d{1,2})?)|ZAR\s*([\d,]+(?:\.\d{1,2})?)/i);
  const parse = (m: RegExpMatchArray | null) => {
    if (!m) return undefined;
    const raw = (m[1] ?? m[2] ?? "").replace(/,/g, "");
    const n = Number(raw);
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
