import { enrichListingsBatch, enrichListingFromUrl } from "@/lib/sourcing/listing-page-enricher";
import { isRelevantProductHit, rankHitsByRelevance } from "@/lib/sourcing/query-relevance";
import { WHOLESALE_DOMAINS } from "@/lib/sourcing/wholesale-supplier-constants";
import {
  isJunkListing,
  isProductPageUrl,
  isValidProductName,
} from "@/lib/sourcing/wholesale-supplier-url";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

export async function enrichProductHits(
  hits: WholesaleSearchHit[],
  query: string,
): Promise<WholesaleSearchHit[]> {
  const sorted = [...hits].sort((a, b) => b.score - a.score);

  for (const hit of sorted.slice(0, 3)) {
    if (!isProductPageUrl(hit.url) || hit.estimatedPriceZar) continue;
    const data = await enrichListingFromUrl(hit.url);
    if (!data) continue;
    hit.title = data.title;
    hit.estimatedPriceZar = data.priceZar;
    hit.listingImageUrl = data.imageUrl;
    hit.listingDescription = data.description;
    hit.listingSummary = data.summary;
    hit.listingHighlights = data.highlights;
    hit.snippet = data.summary ?? `${data.title} listed at R${data.priceZar} on ${hit.domain}`;
    hit.score += 50;
  }

  const productUrls = sorted
    .filter((h) => isProductPageUrl(h.url) && !h.estimatedPriceZar)
    .map((h) => h.url);
  const enriched = await enrichListingsBatch(productUrls, 8);

  return sorted
    .map((hit) => {
      const data = enriched.get(hit.url);
      if (!data) return hit;
      return {
        ...hit,
        title: data.title,
        estimatedPriceZar: data.priceZar,
        estimatedPriceUsd: undefined,
        listingImageUrl: data.imageUrl,
        listingDescription: data.description,
        listingSummary: data.summary,
        listingHighlights: data.highlights,
        snippet: data.summary ?? `${data.title} listed at R${data.priceZar} on ${hit.domain}`,
        score: hit.score + 50,
      };
    })
    .filter((hit) => {
      if (!isValidProductName(hit.title)) return false;
      if (isJunkListing(hit.title, hit.url)) return false;
      if (isProductPageUrl(hit.url)) {
        if (hit.estimatedPriceZar && hit.estimatedPriceZar >= 50) return true;
        return isRelevantProductHit(query, hit.title, hit.snippet, hit.url);
      }
      return WHOLESALE_DOMAINS.some((d) => hit.domain.includes(d));
    });
}

export function dedupeHits(hits: WholesaleSearchHit[]): WholesaleSearchHit[] {
  const seen = new Set<string>();
  const out: WholesaleSearchHit[] = [];
  for (const hit of hits.sort((a, b) => b.score - a.score)) {
    const key = `${hit.domain}${new URL(hit.url).pathname.slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
  }
  return out;
}

export function filterRelevantHits(hits: WholesaleSearchHit[], query: string): WholesaleSearchHit[] {
  const ranked = rankHitsByRelevance(hits, query);
  return ranked.filter((hit) => isRelevantProductHit(query, hit.title, hit.snippet, hit.url));
}
