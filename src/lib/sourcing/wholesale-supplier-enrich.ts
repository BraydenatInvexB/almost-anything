import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";
import { enrichListingsBatch, enrichListingFromUrl, mergeEnrichedListingIntoHit } from "@/lib/sourcing/listing-page-enricher";
import { isRelevantProductHit, rankHitsByRelevance } from "@/lib/sourcing/query-relevance";
import { isExcludedSecondhandDomain } from "@/lib/sourcing/advanced/domain-classifier";
import {
  matchesRequiredAttributes,
  type ParsedQuery,
} from "@/lib/sourcing/advanced/query-parser";
import {
  isAccessoryListing,
  isLowCostConsumableQuery,
  isNonProductListing,
  isPlausibleWholesalePrice,
  isSoftGoodsQuery,
  isWholesaleProductDetailUrl,
} from "@/lib/sourcing/wholesale-listing-quality";
import { WHOLESALE_DOMAINS, isSaApparelWholesaleDomain } from "@/lib/sourcing/wholesale-supplier-constants";
import {
  isJunkListing,
  isProductPageUrl,
  isRetailPriceSource,
  isValidProductName,
} from "@/lib/sourcing/wholesale-supplier-url";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

function hitPriceZar(hit: WholesaleSearchHit): number {
  if (hit.estimatedPriceZar && hit.estimatedPriceZar > 0) return hit.estimatedPriceZar;
  if (hit.estimatedPriceUsd && hit.estimatedPriceUsd > 0) {
    return Math.round(hit.estimatedPriceUsd * ZAR_PER_USD * 100) / 100;
  }
  return Number.MAX_SAFE_INTEGER;
}

export function sortByCheapestWholesale(hits: WholesaleSearchHit[]): WholesaleSearchHit[] {
  return [...hits].sort((a, b) => {
    const priceA = hitPriceZar(a);
    const priceB = hitPriceZar(b);
    if (priceA !== priceB) return priceA - priceB;
    return b.score - a.score;
  });
}

function isWholesalePriceHit(hit: WholesaleSearchHit): boolean {
  if (isRetailPriceSource(hit.domain)) return false;
  if (hit.tier === "retail") return false;
  if (isNonProductListing(hit.title, hit.url, hit.snippet) && !isSaApparelWholesaleDomain(hit.domain)) {
    return false;
  }
  if (WHOLESALE_DOMAINS.some((d) => hit.domain.includes(d))) return true;
  if (isSaApparelWholesaleDomain(hit.domain)) return true;
  if (isProductPageUrl(hit.url)) return !isRetailPriceSource(hit.domain);
  return hit.snippet.toLowerCase().includes("wholesale") || hit.snippet.toLowerCase().includes("moq");
}

function passesListingQuality(hit: WholesaleSearchHit, query: string): boolean {
  if (isExcludedSecondhandDomain(hit.domain)) return false;
  if (isAccessoryListing(query, hit.title, hit.snippet)) return false;
  if (isNonProductListing(hit.title, hit.url, hit.snippet) && !isSaApparelWholesaleDomain(hit.domain)) {
    return false;
  }
  if (!isValidProductName(hit.title)) return false;
  if (isJunkListing(hit.title, hit.url)) return false;
  const priceZar =
    hit.estimatedPriceZar ??
    (hit.estimatedPriceUsd ? Math.round(hit.estimatedPriceUsd * ZAR_PER_USD * 100) / 100 : 0);
  if (priceZar > 0 && !isPlausibleWholesalePrice(query, priceZar)) return false;
  if (WHOLESALE_DOMAINS.some((d) => hit.domain.includes(d))) {
    return isRelevantProductHit(query, hit.title, hit.snippet, hit.url, 20);
  }
  if (isSaApparelWholesaleDomain(hit.domain)) {
    return (
      isRelevantProductHit(query, hit.title, hit.snippet, hit.url, 12) ||
      isSoftGoodsQuery(query)
    );
  }
  return isRelevantProductHit(query, hit.title, hit.snippet, hit.url);
}

function isSaTradeProductHit(hit: WholesaleSearchHit): boolean {
  if (isRetailPriceSource(hit.domain) || hit.tier === "retail") return false;
  if (isExcludedSecondhandDomain(hit.domain)) return false;
  if (WHOLESALE_DOMAINS.some((d) => hit.domain.includes(d))) return true;
  if (isSaApparelWholesaleDomain(hit.domain)) return true;
  if (hit.domain.includes(".co.za") && isProductPageUrl(hit.url)) return true;
  return isProductPageUrl(hit.url);
}

function hitHasPrice(hit: WholesaleSearchHit): boolean {
  return Boolean(
    (hit.estimatedPriceZar && hit.estimatedPriceZar > 0) ||
      (hit.estimatedPriceUsd && hit.estimatedPriceUsd > 0),
  );
}

function intlProductRank(hit: WholesaleSearchHit): number {
  if (hit.domain.includes("made-in-china")) return 0;
  if (hit.domain.includes("alibaba.com")) return 2;
  return 1;
}

function prioritizeProductPages(hits: WholesaleSearchHit[]): WholesaleSearchHit[] {
  return [...hits].sort((a, b) => {
    const aRank = intlProductRank(a);
    const bRank = intlProductRank(b);
    if (aRank !== bRank) return aRank - bRank;
    const aProduct = isProductPageUrl(a.url) || isWholesaleProductDetailUrl(a.url) ? 0 : 1;
    const bProduct = isProductPageUrl(b.url) || isWholesaleProductDetailUrl(b.url) ? 0 : 1;
    if (aProduct !== bProduct) return aProduct - bProduct;
    return hitPriceZar(a) - hitPriceZar(b);
  });
}

export async function enrichProductHits(
  hits: WholesaleSearchHit[],
  query: string,
): Promise<WholesaleSearchHit[]> {
  const wholesaleOnly = [
    ...new Map(
      [
        ...hits.filter(isWholesalePriceHit),
        ...hits.filter(
          (h) =>
            isWholesaleProductDetailUrl(h.url) &&
            !isRetailPriceSource(h.domain) &&
            !isNonProductListing(h.title, h.url, h.snippet),
        ),
      ].map((h) => [h.url, h] as const),
    ).values(),
  ];
  let workingPool = wholesaleOnly;
  if (!workingPool.length) {
    workingPool = hits.filter(
      (h) =>
        isSaTradeProductHit(h) &&
        isRelevantProductHit(query, h.title, h.snippet, h.url, 12) &&
        !isNonProductListing(h.title, h.url, h.snippet),
    );
  }
  const enrichLimit = isLowCostConsumableQuery(query) ? 6 : isSoftGoodsQuery(query) ? 8 : 4;
  const sorted = prioritizeProductPages(sortByCheapestWholesale(workingPool));
  const hasSnippetPrices = sorted.some((h) => h.estimatedPriceZar || h.estimatedPriceUsd);

  if (hasSnippetPrices) {
    let working = sorted.filter((hit) => {
      if (isRetailPriceSource(hit.domain) || hit.tier === "retail") return false;
      return passesListingQuality(hit, query);
    });

    const needsPrice = working.filter(
      (h) =>
        !h.estimatedPriceZar &&
        !h.estimatedPriceUsd &&
        isWholesaleProductDetailUrl(h.url),
    );
    for (const hit of needsPrice.slice(0, isLowCostConsumableQuery(query) ? 6 : 3)) {
      const data = await enrichListingFromUrl(hit.url);
      if (!data?.priceZar) continue;
      hit.title = data.title || hit.title;
      mergeEnrichedListingIntoHit(hit, data);
      hit.listingImageUrl = data.imageUrl;
      hit.listingDescription = data.description;
      hit.listingSummary = data.summary;
      hit.listingHighlights = data.highlights;
      hit.snippet = data.summary ?? hit.snippet;
    }

    working = sortByCheapestWholesale(working).filter((hit) => passesListingQuality(hit, query));
    const pricedFromMerged = hits.filter(
      (hit) =>
        hitHasPrice(hit) &&
        !isRetailPriceSource(hit.domain) &&
        hit.tier !== "retail" &&
        passesListingQuality(hit, query),
    );
    return [
      ...new Map([...pricedFromMerged, ...working].map((h) => [h.url, h] as const)).values(),
    ];
  }

  const enrichCandidates = sorted.filter(
    (h) =>
      (isProductPageUrl(h.url) || isWholesaleProductDetailUrl(h.url)) &&
      !h.estimatedPriceZar &&
      !h.estimatedPriceUsd &&
      !isRetailPriceSource(h.domain),
  );

  for (const hit of enrichCandidates.slice(0, isLowCostConsumableQuery(query) ? 3 : 2)) {
    const data = await enrichListingFromUrl(hit.url);
    if (!data?.priceZar) continue;
    hit.title = data.title || hit.title;
    mergeEnrichedListingIntoHit(hit, data);
    hit.listingImageUrl = data.imageUrl ?? hit.listingImageUrl;
    hit.listingDescription = data.description ?? hit.listingDescription;
    hit.listingSummary = data.summary ?? hit.listingSummary;
    hit.listingHighlights = data.highlights ?? hit.listingHighlights;
    hit.snippet = data.summary ?? `${data.title} trade listing on ${hit.domain}`;
    hit.score += 50;
  }

  const productUrls = enrichCandidates.map((h) => h.url);
  const enriched = await enrichListingsBatch(productUrls, enrichLimit);

  const enrichedPool = sorted
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
        snippet: data.summary ?? `${data.title} trade listing on ${hit.domain}`,
        score: hit.score + 50,
      };
    })
    .filter((hit) => {
      if (isRetailPriceSource(hit.domain) || hit.tier === "retail") return false;
      return passesListingQuality(hit, query);
    });

  const pricedFromInput = hits.filter(
    (hit) =>
      hitHasPrice(hit) &&
      !isRetailPriceSource(hit.domain) &&
      hit.tier !== "retail" &&
      passesListingQuality(hit, query),
  );

  return [
    ...new Map([...pricedFromInput, ...enrichedPool].map((h) => [h.url, h] as const)).values(),
  ];
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

export function filterRelevantHits(
  hits: WholesaleSearchHit[],
  query: string,
  parsedQuery?: ParsedQuery,
): WholesaleSearchHit[] {
  const ranked = rankHitsByRelevance(hits, query);
  return ranked.filter((hit) => {
    if (isExcludedSecondhandDomain(hit.domain)) return false;
    if (isRetailPriceSource(hit.domain)) return false;
    if (
      !isRelevantProductHit(query, hit.title, hit.snippet, hit.url) &&
      !(isSoftGoodsQuery(query) && isSaApparelWholesaleDomain(hit.domain))
    ) {
      return false;
    }
    if (parsedQuery) {
      const text = `${hit.title} ${hit.snippet} ${hit.listingDescription ?? ""}`;
      if (!matchesRequiredAttributes(hit.title, text, parsedQuery).matches) return false;
    }
    return true;
  });
}
