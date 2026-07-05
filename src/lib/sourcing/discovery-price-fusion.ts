import "server-only";

import { enrichListingFromUrl } from "@/lib/sourcing/listing-page-enricher";
import { isPlausibleWholesalePrice } from "@/lib/sourcing/wholesale-listing-quality";
import { isSaSupplierHit } from "@/lib/sourcing/wholesale-sa-priority";
import { isRetailPriceSource } from "@/lib/sourcing/wholesale-supplier-url";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

export function hitHasPrice(hit: WholesaleSearchHit): boolean {
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

export function fusePriceSignals(hits: WholesaleSearchHit[]): WholesaleSearchHit[] {
  const pricedByDomain = new Map<string, WholesaleSearchHit>();

  for (const hit of hits) {
    if (!hitHasPrice(hit)) continue;
    const key = domainKey(hit.url);
    const existing = pricedByDomain.get(key);
    if (!existing || hit.score > existing.score) pricedByDomain.set(key, hit);
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
    candidates.map(async (hit) => ({ hit, data: await enrichListingFromUrl(hit.url) })),
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
