import "server-only";

import { applyAdvancedHitRanking } from "@/lib/sourcing/advanced/candidate-picker";
import { runAdvancedGoogleSearchPipeline } from "@/lib/sourcing/advanced/advanced-search-pipeline";
import { parseQuery } from "@/lib/sourcing/advanced/query-parser";
import {
  backfillSaListingPrices,
  fusePriceSignals,
  hitHasPrice,
} from "@/lib/sourcing/discovery-price-fusion";
import { searchWithVariants } from "@/lib/sourcing/discovery-search-variants";
export { runSoftGoodsSaSearchPipeline } from "@/lib/sourcing/discovery-soft-goods-search";
export { backfillSaListingPrices, fusePriceSignals } from "@/lib/sourcing/discovery-price-fusion";
import { enrichListingFromUrl, mergeEnrichedListingIntoHit } from "@/lib/sourcing/listing-page-enricher";
import {
  dedupeHits,
  enrichProductHits,
  filterRelevantHits,
} from "@/lib/sourcing/wholesale-supplier-enrich";
import {
  searchConsumableIntlProducts,
  searchInternationalTradePriceListings,
  searchInternationalWholesale,
  searchSaTradePriceListings,
  searchSaWholesaleSuppliers,
  searchSoftGoodsIntlProducts,
  searchSoftGoodsSaProducts,
} from "@/lib/sourcing/wholesale-supplier-sa-search";
import {
  isSaSupplierHit,
  shouldSearchInternational,
  sortBySaWholesaleFirst,
} from "@/lib/sourcing/wholesale-sa-priority";
import {
  isLowCostConsumableQuery,
  isPlausibleWholesalePrice,
  isSoftGoodsQuery,
  isWholesaleProductDetailUrl,
} from "@/lib/sourcing/wholesale-listing-quality";
import { isRelevantProductHit } from "@/lib/sourcing/query-relevance";
import { isRetailPriceSource } from "@/lib/sourcing/wholesale-supplier-url";
import { searchSupplierEngine } from "@/lib/sourcing/supplier-engine/run-supplier-engine";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

export async function runDiscoverySearchPipeline(
  query: string,
  options?: { maxResults?: number },
): Promise<WholesaleSearchHit[]> {
  const maxResults = options?.maxResults ?? (isLowCostConsumableQuery(query) ? 16 : 12);
  const parsedQuery = await parseQuery(query);
  const softGoods = isSoftGoodsQuery(query);

  const [saCore, saPrice, saSoft, advancedHits, engineHits] = await Promise.all([
    searchWithVariants(searchSaWholesaleSuppliers, parsedQuery, query),
    searchWithVariants(searchSaTradePriceListings, parsedQuery, query),
    softGoods
      ? searchWithVariants(searchSoftGoodsSaProducts, parsedQuery, query)
      : Promise.resolve([] as WholesaleSearchHit[]),
    runAdvancedGoogleSearchPipeline(query, parsedQuery),
    searchSupplierEngine(parsedQuery.canonicalProduct || query, {
      maxResults: isLowCostConsumableQuery(query) ? 14 : 12,
      overseas: softGoods ? "no" : "auto",
    }),
  ]);

  let merged = fusePriceSignals(
    dedupeHits([...engineHits, ...saCore, ...saPrice, ...saSoft, ...advancedHits]),
  );
  merged = await backfillSaListingPrices(
    merged,
    query,
    softGoods ? 8 : isLowCostConsumableQuery(query) ? 8 : 4,
  );

  if (softGoods && !merged.some((h) => isSaSupplierHit(h) && hitHasPrice(h))) {
    const saUnpriced = merged
      .filter((h) => isSaSupplierHit(h) && !hitHasPrice(h) && h.domain.includes(".co.za"))
      .slice(0, 6);
    const priced = await Promise.all(
      saUnpriced.map(async (hit) => ({ hit, data: await enrichListingFromUrl(hit.url) })),
    );
    for (const { hit, data } of priced) {
      if (!data?.priceZar || !isPlausibleWholesalePrice(query, data.priceZar)) continue;
      hit.title = data.title || hit.title;
      mergeEnrichedListingIntoHit(hit, data);
      hit.listingImageUrl = data.imageUrl ?? hit.listingImageUrl;
      hit.listingDescription = data.description ?? hit.listingDescription;
      hit.listingSummary = data.summary ?? hit.listingSummary;
      hit.listingHighlights = data.highlights ?? hit.listingHighlights;
      hit.snippet = data.summary ?? hit.snippet;
      hit.score += 90;
    }
  }

  const intlSearches: Promise<WholesaleSearchHit[]>[] = [];
  if (shouldSearchInternational(merged, query)) {
    intlSearches.push(
      searchWithVariants(searchInternationalWholesale, parsedQuery, query),
      searchWithVariants(searchInternationalTradePriceListings, parsedQuery, query),
    );
  }
  if (isLowCostConsumableQuery(query)) {
    intlSearches.push(searchWithVariants(searchConsumableIntlProducts, parsedQuery, query));
  }
  if (isSoftGoodsQuery(query)) {
    intlSearches.push(searchWithVariants(searchSoftGoodsIntlProducts, parsedQuery, query));
  }
  if (intlSearches.length) {
    const intlBatches = await Promise.all(intlSearches);
    merged = fusePriceSignals(dedupeHits([...merged, ...intlBatches.flat()]));
  }

  if ((isLowCostConsumableQuery(query) || isSoftGoodsQuery(query)) && !merged.some(hitHasPrice)) {
    const intlDetails = merged
      .filter(
        (h) =>
          isWholesaleProductDetailUrl(h.url) &&
          !isRetailPriceSource(h.domain) &&
          isRelevantProductHit(query, h.title, h.snippet, h.url, 8),
      )
      .sort((a, b) => {
        const rank = (h: WholesaleSearchHit) =>
          h.domain.includes("made-in-china") ? 0 : h.domain.includes("alibaba.com") ? 2 : 1;
        return rank(a) - rank(b);
      })
      .slice(0, isSoftGoodsQuery(query) ? 6 : 5);
    const priced = await Promise.all(
      intlDetails.map(async (hit) => ({ hit, data: await enrichListingFromUrl(hit.url) })),
    );
    for (const { hit, data } of priced) {
      if (!data?.priceZar || !isPlausibleWholesalePrice(query, data.priceZar)) continue;
      hit.title = data.title || hit.title;
      mergeEnrichedListingIntoHit(hit, data);
      hit.listingImageUrl = data.imageUrl ?? hit.listingImageUrl;
      hit.listingDescription = data.description ?? hit.listingDescription;
      hit.listingSummary = data.summary ?? hit.listingSummary;
      hit.listingHighlights = data.highlights ?? hit.listingHighlights;
      hit.snippet = data.summary ?? hit.snippet;
      hit.score += 80;
    }
  }

  const enriched = await enrichProductHits(merged, query);
  let relevant = filterRelevantHits(
    enriched,
    query,
    isLowCostConsumableQuery(query) ? undefined : parsedQuery,
  );

  if ((isLowCostConsumableQuery(query) || isSoftGoodsQuery(query)) && !relevant.some(hitHasPrice)) {
    const intlDetail = enriched
      .filter(
        (h) =>
          isWholesaleProductDetailUrl(h.url) &&
          !hitHasPrice(h) &&
          isRelevantProductHit(query, h.title, h.snippet, h.url, 8),
      )
      .slice(0, 2);
    const priced = await Promise.all(
      intlDetail.map(async (hit) => ({ hit, data: await enrichListingFromUrl(hit.url) })),
    );
    for (const { hit, data } of priced) {
      if (!data?.priceZar || !isPlausibleWholesalePrice(query, data.priceZar)) continue;
      hit.title = data.title || hit.title;
      mergeEnrichedListingIntoHit(hit, data);
      hit.listingImageUrl = data.imageUrl ?? hit.listingImageUrl;
      hit.snippet = data.summary ?? hit.snippet;
      hit.score += 60;
    }
    relevant = filterRelevantHits(enriched, query);
  }

  const pricedFirst = sortBySaWholesaleFirst(relevant).sort((a, b) => {
    const aPriced = hitHasPrice(a) ? 0 : 1;
    const bPriced = hitHasPrice(b) ? 0 : 1;
    if (aPriced !== bPriced) return aPriced - bPriced;
    return 0;
  });

  return applyAdvancedHitRanking(pricedFirst, parsedQuery).slice(0, maxResults);
}
