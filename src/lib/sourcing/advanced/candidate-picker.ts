import "server-only";

import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";
import {
  matchesRequiredAttributes,
  type ParsedQuery,
} from "@/lib/sourcing/advanced/query-parser";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

const TIER_ORDER: Record<string, number> = {
  manufacturer: 0,
  wholesale: 1,
  distributor: 2,
  trade: 3,
  retail: 4,
};

function hitPriceZar(hit: WholesaleSearchHit): number {
  if (hit.estimatedPriceZar && hit.estimatedPriceZar > 0) return hit.estimatedPriceZar;
  if (hit.estimatedPriceUsd && hit.estimatedPriceUsd > 0) {
    return Math.round(hit.estimatedPriceUsd * ZAR_PER_USD * 100) / 100;
  }
  return Number.MAX_SAFE_INTEGER;
}

export function filterHitsByParsedAttributes(
  hits: WholesaleSearchHit[],
  parsed: ParsedQuery,
): WholesaleSearchHit[] {
  return hits.filter((hit) => {
    const text = `${hit.title} ${hit.snippet} ${hit.listingDescription ?? ""}`;
    return matchesRequiredAttributes(hit.title, text, parsed).matches;
  });
}

/** Reject statistical price outliers within a result set (wrong-product cheap matches). */
export function rejectPriceOutliers(hits: WholesaleSearchHit[]): WholesaleSearchHit[] {
  const priced = hits.filter((h) => hitPriceZar(h) < Number.MAX_SAFE_INTEGER);
  if (priced.length <= 2) return hits;

  const sorted = [...priced].sort((a, b) => hitPriceZar(a) - hitPriceZar(b));
  const median = hitPriceZar(sorted[Math.floor(sorted.length / 2)]);
  const floor = median * 0.5;

  return hits.filter((h) => {
    const price = hitPriceZar(h);
    if (price >= Number.MAX_SAFE_INTEGER) return true;
    return price >= floor;
  });
}

export function rankHitsBySupplierTier(hits: WholesaleSearchHit[]): WholesaleSearchHit[] {
  return [...hits].sort((a, b) => {
    const tierA = TIER_ORDER[a.tier] ?? 3;
    const tierB = TIER_ORDER[b.tier] ?? 3;
    if (tierA !== tierB) return tierA - tierB;

    const priceA = hitPriceZar(a);
    const priceB = hitPriceZar(b);
    if (priceA !== priceB) return priceA - priceB;

    return b.score - a.score;
  });
}

export function applyAdvancedHitRanking(
  hits: WholesaleSearchHit[],
  parsed?: ParsedQuery,
): WholesaleSearchHit[] {
  let working = hits;
  if (parsed) working = filterHitsByParsedAttributes(working, parsed);
  working = rejectPriceOutliers(working);
  return rankHitsBySupplierTier(working);
}
