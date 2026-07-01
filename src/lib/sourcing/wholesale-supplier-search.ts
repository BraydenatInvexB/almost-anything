import "server-only";

import type { SupplierListing, WholesaleSearchHit } from "@/types/supplier-sourcing";
import { SA_IMAGE_ONLY_DOMAINS } from "@/lib/sourcing/wholesale-supplier-constants";
import { runDiscoverySearchPipeline } from "@/lib/sourcing/discovery-search-engine";
import { sortBySaWholesaleFirst } from "@/lib/sourcing/wholesale-sa-priority";
import { classifyDomain } from "@/lib/sourcing/wholesale-supplier-url";

export { SA_IMAGE_ONLY_DOMAINS };
export {
  isJunkListing,
  isJunkProductTitle,
  isProductPageUrl,
  isRetailPriceSource,
  isValidProductName,
} from "@/lib/sourcing/wholesale-supplier-url";

export async function searchWholesaleSuppliers(
  query: string,
  options?: { maxResults?: number },
): Promise<WholesaleSearchHit[]> {
  return runDiscoverySearchPipeline(query, options);
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

  const sorted = sortBySaWholesaleFirst(hits);
  const listings = sorted.map((h, i) => hitToSupplierListing(h, i));
  const saListings = listings.filter((l) => l.region === "south_africa");
  const intlListings = listings.filter((l) => l.region !== "south_africa");

  const cheapestSa = saListings.find(
    (l) => (l.wholesalePriceZar && l.wholesalePriceZar > 0) || l.wholesalePriceUsd,
  );
  const cheapestAny = listings.find(
    (l) => (l.wholesalePriceZar && l.wholesalePriceZar > 0) || l.wholesalePriceUsd,
  );
  const primary = listings[primaryIndex] ?? cheapestSa ?? cheapestAny ?? listings[0];
  primary.isPrimary = true;

  const alternates = [
    ...listings.filter((l) => l.id !== primary.id && l.region === "south_africa"),
    ...intlListings.filter((l) => l.id !== primary.id),
  ].slice(0, 4);

  return {
    primary,
    alternates,
    searchQuery: query,
    searchedAt: new Date().toISOString(),
    cheapestWholesaleZar: cheapestSa?.wholesalePriceZar ?? cheapestAny?.wholesalePriceZar,
    researchNotes:
      listings.length > 0
        ? saListings.length > 0
          ? `Found ${saListings.length} South African trade source(s)${intlListings.length ? ` and ${intlListings.length} international fallback(s)` : ""}, sorted SA-first then lowest cost.`
          : `Found ${listings.length} wholesale source(s) — no SA trade listing yet; showing best available trade pricing.`
        : `No wholesale listing found yet. Try a more specific product name or model number.`,
  };
}
