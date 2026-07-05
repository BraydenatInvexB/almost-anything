import { isRelevantProductHit, rankHitsByRelevance } from "@/lib/sourcing/query-relevance";
import {
  isPlausibleWholesalePrice,
  isSoftGoodsQuery,
  productNameMatchesQuery,
} from "@/lib/sourcing/wholesale-listing-quality";
import { isJunkProductTitle } from "@/lib/sourcing/wholesale-supplier-search";
import { isSaApparelWholesaleDomain } from "@/lib/sourcing/wholesale-supplier-constants";
import type { DiscoveredProductDraft } from "@/lib/sourcing/product-intelligence-types";
import { mapHitToDraft } from "@/lib/sourcing/product-intelligence-hit-mapper";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

export function sortByWholesalePrice(drafts: DiscoveredProductDraft[]): DiscoveredProductDraft[] {
  return [...drafts].sort((a, b) => a.basePrice - b.basePrice);
}

export function sortByRelevanceThenPrice(hits: WholesaleSearchHit[]): WholesaleSearchHit[] {
  return [...hits].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.estimatedPriceZar ?? Number.MAX_SAFE_INTEGER) - (b.estimatedPriceZar ?? Number.MAX_SAFE_INTEGER);
  });
}

export function pickRelevantHits(query: string, hits: WholesaleSearchHit[]): WholesaleSearchHit[] {
  const ranked = rankHitsByRelevance(hits, query);
  return ranked.filter((hit) => {
    if (isSoftGoodsQuery(query) && isSaApparelWholesaleDomain(hit.domain)) return true;
    return isRelevantProductHit(query, hit.title, hit.snippet, hit.url);
  });
}

export function draftsFromHits(
  hits: WholesaleSearchHit[],
  query: string,
  allHits: WholesaleSearchHit[],
  maxProducts: number,
): DiscoveredProductDraft[] {
  return pickRelevantHits(query, hits)
    .slice(0, maxProducts + 2)
    .map((hit, i) => mapHitToDraft(hit, query, i, allHits))
    .filter((p): p is DiscoveredProductDraft => p !== null);
}

export function filterPublishableDrafts(
  drafts: DiscoveredProductDraft[],
  query: string,
): DiscoveredProductDraft[] {
  return drafts.filter(
    (d) =>
      isPlausibleWholesalePrice(query, d.basePrice) &&
      productNameMatchesQuery(query, d.name) &&
      !isJunkProductTitle(d.name),
  );
}
