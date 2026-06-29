import "server-only";

import type { SupplierListing, WholesaleSearchHit } from "@/types/supplier-sourcing";
import {
  SA_IMAGE_ONLY_DOMAINS,
  SA_RETAILER_SITES,
  SEARCH_TIERS,
} from "@/lib/sourcing/wholesale-supplier-constants";
import {
  dedupeHits,
  enrichProductHits,
  filterRelevantHits,
} from "@/lib/sourcing/wholesale-supplier-enrich";
import { fetchDuckDuckGoMarkdown } from "@/lib/sourcing/wholesale-supplier-fetch";
import { parseSearchResults } from "@/lib/sourcing/wholesale-supplier-parse";
import {
  searchBroadSouthAfrica,
  searchDirectSaSites,
  searchSaRetailerListings,
} from "@/lib/sourcing/wholesale-supplier-sa-search";
import { classifyDomain } from "@/lib/sourcing/wholesale-supplier-url";

export { SA_IMAGE_ONLY_DOMAINS };
export {
  isJunkListing,
  isProductPageUrl,
  isValidProductName,
} from "@/lib/sourcing/wholesale-supplier-url";

export async function searchWholesaleSuppliers(
  query: string,
  options?: { maxResults?: number },
): Promise<WholesaleSearchHit[]> {
  const maxResults = options?.maxResults ?? 12;

  const [retailerHits, directHits, broadSaHits] = await Promise.all([
    searchSaRetailerListings(query),
    searchDirectSaSites(query),
    searchBroadSouthAfrica(query),
  ]);

  const allHits: WholesaleSearchHit[] = [...retailerHits, ...directHits, ...broadSaHits];
  let ranked = filterRelevantHits(await enrichProductHits(dedupeHits(allHits), query), query);
  if (ranked.length >= 1) return ranked.slice(0, maxResults);

  const intlTiers = SEARCH_TIERS.slice(4);
  const ddgPages = await Promise.all(
    intlTiers.map(async (tier) => ({
      tier,
      markdown: await fetchDuckDuckGoMarkdown(tier.query(query)),
    })),
  );

  for (const { tier, markdown } of ddgPages) {
    if (markdown) {
      allHits.push(...parseSearchResults(markdown, tier, query));
    }
  }

  ranked = filterRelevantHits(await enrichProductHits(dedupeHits(allHits), query), query);
  return ranked.slice(0, maxResults);
}

export function hitToSupplierListing(hit: WholesaleSearchHit, index: number): SupplierListing {
  const classification = classifyDomain(hit.domain);
  return {
    id: `sup-${index}-${hit.domain.replace(/\./g, "-")}`,
    supplierName: hit.title.slice(0, 80) || hit.domain,
    supplierUrl: hit.url,
    region: hit.region,
    tier: hit.tier,
    wholesalePriceUsd: hit.estimatedPriceUsd,
    wholesalePriceZar: hit.estimatedPriceZar,
    currency: hit.estimatedPriceZar ? "ZAR" : hit.estimatedPriceUsd ? "USD" : undefined,
    country: hit.region === "south_africa" ? "South Africa" : undefined,
    listingTitle: hit.title,
    notes: hit.snippet.slice(0, 200),
    discoveredAt: new Date().toISOString(),
    isPrimary: index === 0,
  };
}

export function buildSupplierIntel(
  query: string,
  hits: WholesaleSearchHit[],
  primaryIndex = 0,
): import("@/types/supplier-sourcing").ProductSupplierIntel | null {
  if (!hits.length) return null;

  const listings = hits.map((h, i) => hitToSupplierListing(h, i));
  const saListings = listings.filter((l) => l.region === "south_africa");
  const intlListings = listings.filter((l) => l.region !== "south_africa");

  const cheapestSa = [...saListings]
    .filter((l) => l.wholesalePriceZar && l.wholesalePriceZar > 0)
    .sort((a, b) => (a.wholesalePriceZar ?? Infinity) - (b.wholesalePriceZar ?? Infinity))[0];

  const fallbackPrimary = listings[primaryIndex] ?? listings[0];
  const primary = cheapestSa ?? saListings[0] ?? fallbackPrimary;
  primary.isPrimary = true;

  const alternates = [
    ...saListings.filter((l) => l.id !== primary.id),
    ...intlListings,
  ].slice(0, 4);

  const priced = listings.filter((l) => l.wholesalePriceZar && l.wholesalePriceZar > 0);
  const cheapest = priced.sort(
    (a, b) => (a.wholesalePriceZar ?? Infinity) - (b.wholesalePriceZar ?? Infinity),
  )[0];

  return {
    primary,
    alternates,
    searchQuery: query,
    searchedAt: new Date().toISOString(),
    cheapestWholesaleZar: cheapest?.wholesalePriceZar,
    researchNotes:
      saListings.length > 0
        ? `Searched ${SA_RETAILER_SITES.length} major SA stores plus open-web .co.za suppliers — found ${saListings.length} local listing(s) and ${intlListings.length} international option(s).`
        : `No SA listing found yet — showing international wholesale options. Try a more specific product name.`,
  };
}
