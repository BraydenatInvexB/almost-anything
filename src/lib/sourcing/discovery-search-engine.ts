import "server-only";

import {
  applyAdvancedHitRanking,
} from "@/lib/sourcing/advanced/candidate-picker";
import {
  runAdvancedGoogleSearchPipeline,
} from "@/lib/sourcing/advanced/advanced-search-pipeline";
import { parseQuery } from "@/lib/sourcing/advanced/query-parser";
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
} from "@/lib/sourcing/wholesale-supplier-sa-search";
import {
  isSaSupplierHit,
  shouldSearchInternational,
  sortBySaWholesaleFirst,
} from "@/lib/sourcing/wholesale-sa-priority";
import { isLowCostConsumableQuery, isPlausibleWholesalePrice, isWholesaleProductDetailUrl } from "@/lib/sourcing/wholesale-listing-quality";
import { isRelevantProductHit } from "@/lib/sourcing/query-relevance";
import { isRetailPriceSource } from "@/lib/sourcing/wholesale-supplier-url";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

function hitHasPrice(hit: WholesaleSearchHit): boolean {
  return Boolean(
    (hit.estimatedPriceZar && hit.estimatedPriceZar > 0) ||
      (hit.estimatedPriceUsd && hit.estimatedPriceUsd > 0),
  );
}

function domainKey(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url;
  }
}

/** Merge ZAR/USD from price-focused hits onto matching supplier hits missing a figure. */
export function fusePriceSignals(hits: WholesaleSearchHit[]): WholesaleSearchHit[] {
  const pricedByDomain = new Map<string, WholesaleSearchHit>();

  for (const hit of hits) {
    if (!hitHasPrice(hit)) continue;
    const key = domainKey(hit.url);
    const existing = pricedByDomain.get(key);
    if (!existing || hit.score > existing.score) {
      pricedByDomain.set(key, hit);
    }
  }

  return hits.map((hit) => {
    if (hitHasPrice(hit)) return hit;
    const donor = pricedByDomain.get(domainKey(hit.url));
    if (!donor) return hit;
    return {
      ...hit,
      estimatedPriceZar: donor.estimatedPriceZar,
      estimatedPriceUsd: donor.estimatedPriceUsd,
      score: hit.score + 25,
    };
  });
}

/** Jina enrich top SA trade listings that still lack a snippet price. */
export async function backfillSaListingPrices(
  hits: WholesaleSearchHit[],
  query: string,
  limit = 4,
): Promise<WholesaleSearchHit[]> {
  const candidates = hits
    .filter(
      (h) =>
        !hitHasPrice(h) &&
        isSaSupplierHit(h) &&
        !isRetailPriceSource(h.domain) &&
        h.domain.includes(".co.za"),
    )
    .slice(0, limit);

  if (!candidates.length) return hits;

  const enriched = await Promise.all(
    candidates.map(async (hit) => ({
      hit,
      data: await enrichListingFromUrl(hit.url),
    })),
  );

  const priceByUrl = new Map(
    enriched
      .filter(({ data }) => data?.priceZar && data.priceZar > 0)
      .map(({ hit, data }) => [hit.url, data!]),
  );

  if (!priceByUrl.size) return hits;

  return hits.map((hit) => {
    const data = priceByUrl.get(hit.url);
    if (!data?.priceZar || !isPlausibleWholesalePrice(query, data.priceZar)) return hit;
    return {
      ...hit,
      title: data.title || hit.title,
      estimatedPriceZar: data.priceZar,
      estimatedPriceUsd: undefined,
      supplierMoq: data.supplierMoq ?? hit.supplierMoq,
      priceVatStatus: data.priceVatStatus ?? hit.priceVatStatus,
      listingImageUrl: data.imageUrl ?? hit.listingImageUrl,
      listingDescription: data.description ?? hit.listingDescription,
      listingSummary: data.summary ?? hit.listingSummary,
      listingHighlights: data.highlights ?? hit.listingHighlights,
      snippet: data.summary ?? hit.snippet,
      score: hit.score + 40,
    };
  });
}

async function searchWithVariants(
  searchFn: (q: string) => Promise<WholesaleSearchHit[]>,
  parsed: Awaited<ReturnType<typeof parseQuery>>,
  originalQuery: string,
): Promise<WholesaleSearchHit[]> {
  const trimmed = originalQuery.trim();
  const queries = [
    trimmed,
    parsed.canonicalProduct,
    ...parsed.searchVariants.filter((v) => v !== parsed.canonicalProduct && v !== trimmed),
  ]
    .filter((q) => q.length >= 2)
    .filter((q, i, arr) => arr.indexOf(q) === i)
    .slice(0, 4);

  const batches = await Promise.all(queries.map((q) => searchFn(q)));
  return dedupeHits(batches.flat());
}

/**
 * Multi-pass wholesale discovery:
 * - Structured query parsing + hard attribute gates
 * - DuckDuckGo SA wholesale + price tiers
 * - Google CSE structured page extraction (when configured)
 * - Price fusion + SA listing enrich + international fallback
 * - Tier ranking + price outlier rejection
 */
export async function runDiscoverySearchPipeline(
  query: string,
  options?: { maxResults?: number },
): Promise<WholesaleSearchHit[]> {
  const maxResults = options?.maxResults ?? (isLowCostConsumableQuery(query) ? 16 : 12);
  const parsedQuery = await parseQuery(query);

  const [saCore, saPrice, advancedHits] = await Promise.all([
    searchWithVariants(searchSaWholesaleSuppliers, parsedQuery, query),
    searchWithVariants(searchSaTradePriceListings, parsedQuery, query),
    runAdvancedGoogleSearchPipeline(query, parsedQuery),
  ]);

  let merged = fusePriceSignals(dedupeHits([...saCore, ...saPrice, ...advancedHits]));
  merged = await backfillSaListingPrices(merged, query, isLowCostConsumableQuery(query) ? 8 : 4);

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
  if (intlSearches.length) {
    const intlBatches = await Promise.all(intlSearches);
    merged = fusePriceSignals(dedupeHits([...merged, ...intlBatches.flat()]));
  }

  if (isLowCostConsumableQuery(query) && !merged.some(hitHasPrice)) {
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
      .slice(0, 5);
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

  if (isLowCostConsumableQuery(query) && !relevant.some(hitHasPrice)) {
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
