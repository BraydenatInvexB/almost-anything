import "server-only";

import { runAdvancedGoogleSearchPipeline } from "@/lib/sourcing/advanced/advanced-search-pipeline";
import { parseQuery } from "@/lib/sourcing/advanced/query-parser";
import {
  backfillSaListingPrices,
  fusePriceSignals,
  hitHasPrice,
} from "@/lib/sourcing/discovery-price-fusion";
import { searchWithVariants } from "@/lib/sourcing/discovery-search-variants";
import { enrichListingFromUrl, mergeEnrichedListingIntoHit } from "@/lib/sourcing/listing-page-enricher";
import { isPlausibleWholesalePrice } from "@/lib/sourcing/wholesale-listing-quality";
import {
  dedupeHits,
  enrichProductHits,
  filterRelevantHits,
} from "@/lib/sourcing/wholesale-supplier-enrich";
import {
  isSaSupplierHit,
  sortBySaWholesaleFirst,
} from "@/lib/sourcing/wholesale-sa-priority";
import {
  searchSaTradePriceListings,
  searchSaWholesaleSuppliers,
  searchSoftGoodsSaProducts,
} from "@/lib/sourcing/wholesale-supplier-sa-search";
import {
  isSaApparelWholesaleDomain,
  SA_SOFT_GOODS_SEED_URLS,
} from "@/lib/sourcing/wholesale-supplier-constants";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

/** SA-only soft goods search — skips the Python supplier engine so apparel discovery stays fast. */
export async function runSoftGoodsSaSearchPipeline(query: string): Promise<WholesaleSearchHit[]> {
  const parsedQuery = await parseQuery(query);

  const [saCore, saPrice, saSoft, advancedHits] = await Promise.all([
    searchWithVariants(searchSaWholesaleSuppliers, parsedQuery, query),
    searchWithVariants(searchSaTradePriceListings, parsedQuery, query),
    searchWithVariants(searchSoftGoodsSaProducts, parsedQuery, query),
    runAdvancedGoogleSearchPipeline(query, parsedQuery),
  ]);

  let merged = fusePriceSignals(
    dedupeHits([...saCore, ...saPrice, ...saSoft, ...advancedHits]),
  );

  if (!merged.some((h) => isSaSupplierHit(h) && isSaApparelWholesaleDomain(h.domain))) {
    for (const seed of SA_SOFT_GOODS_SEED_URLS) {
      merged.push({
        title: seed.title,
        url: seed.url,
        snippet: `${seed.title} — South African wholesale trade supplier`,
        domain: seed.domain,
        region: "south_africa",
        tier: "wholesale",
        score: 200,
      });
    }
  }

  merged = await backfillSaListingPrices(merged, query, 8);

  const saUnpriced = merged
    .filter(
      (h) =>
        isSaSupplierHit(h) &&
        !hitHasPrice(h) &&
        (h.domain.includes(".co.za") || isSaApparelWholesaleDomain(h.domain)),
    )
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

  const enriched = await enrichProductHits(merged, query);
  const relevant = filterRelevantHits(enriched, query, parsedQuery).filter(isSaSupplierHit);

  return sortBySaWholesaleFirst(relevant)
    .sort((a, b) => {
      const aTrade = isSaApparelWholesaleDomain(a.domain) ? 0 : 1;
      const bTrade = isSaApparelWholesaleDomain(b.domain) ? 0 : 1;
      if (aTrade !== bTrade) return aTrade - bTrade;
      const aPriced = hitHasPrice(a) ? 0 : 1;
      const bPriced = hitHasPrice(b) ? 0 : 1;
      return aPriced - bPriced;
    })
    .slice(0, 14);
}
