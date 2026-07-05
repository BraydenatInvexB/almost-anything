import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";
import {
  isLowCostConsumableQuery,
  isPlausibleWholesalePrice,
  isSoftGoodsQuery,
  isSpecificIntlProductTitle,
  isWholesaleProductDetailUrl,
} from "@/lib/sourcing/wholesale-listing-quality";
import { isRelevantProductHit } from "@/lib/sourcing/query-relevance";
import {
  searchConsumableIntlProducts,
  searchInternationalWholesale,
  searchSoftGoodsIntlProducts,
} from "@/lib/sourcing/wholesale-supplier-sa-search";
import { extractPrices } from "@/lib/sourcing/wholesale-supplier-scoring";
import { isJunkProductTitle } from "@/lib/sourcing/wholesale-supplier-url";
import { isProductPageUrl } from "@/lib/sourcing/wholesale-supplier-search";
import { MAX_PRODUCTS, MIN_PRODUCTS } from "@/lib/sourcing/product-intelligence-prompts";
import {
  type DiscoveredProductDraft,
  draftsFromHits,
  filterPublishableDrafts,
  mapHitToDraft,
  pickRelevantHits,
} from "@/lib/sourcing/product-intelligence-mappers";
import { enrichListingFromUrl, mergeEnrichedListingIntoHit } from "@/lib/sourcing/listing-page-enricher";
import { sortBySaWholesaleFirst } from "@/lib/sourcing/wholesale-sa-priority";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

function minListedPrice(query: string): number {
  if (/\b(pencil|pen|stationery|notebook|eraser)\b/i.test(query)) return 8;
  return 15;
}

export function hasListedPrice(hit: WholesaleSearchHit, query: string): boolean {
  const floor = minListedPrice(query);
  if (hit.estimatedPriceZar != null && hit.estimatedPriceZar >= floor) return true;
  if (hit.estimatedPriceUsd != null && hit.estimatedPriceUsd > 0) {
    const zar = Math.round(hit.estimatedPriceUsd * ZAR_PER_USD * 100) / 100;
    if (zar >= floor) return true;
    if (isLowCostConsumableQuery(query) && hit.estimatedPriceUsd >= 0.1) return true;
  }
  return false;
}

export function backfillHitPricesFromText(hits: WholesaleSearchHit[], query: string): void {
  for (const hit of hits) {
    if (hasListedPrice(hit, query)) continue;
    const prices = extractPrices(
      `${hit.title} ${hit.snippet} ${hit.listingDescription ?? ""} ${hit.listingSummary ?? ""}`,
      query,
    );
    if (prices.zar && isPlausibleWholesalePrice(query, prices.zar)) {
      hit.estimatedPriceZar = prices.zar;
      hit.estimatedPriceUsd = prices.usd;
    }
  }
}

function isIntlProductDetailCandidate(hit: WholesaleSearchHit, query: string): boolean {
  if (
    isSoftGoodsQuery(query) &&
    (hit.domain.includes("alibaba.com") || hit.domain.includes("made-in-china.com")) &&
    isSpecificIntlProductTitle(hit.title, hit.snippet)
  ) {
    return true;
  }
  if (isWholesaleProductDetailUrl(hit.url)) {
    return isRelevantProductHit(query, hit.title, hit.snippet, hit.url, 8);
  }
  return isRelevantProductHit(query, hit.title, hit.snippet, hit.url, 8);
}

export async function consumableIntlFallback(query: string): Promise<DiscoveredProductDraft[]> {
  return intlProductDetailFallback(query, searchConsumableIntlProducts);
}

export async function softGoodsIntlFallback(query: string): Promise<DiscoveredProductDraft[]> {
  return intlProductDetailFallback(query, searchSoftGoodsIntlProducts, { skipIntlWholesale: true });
}

async function intlProductDetailFallback(
  query: string,
  extraSearch: (q: string) => Promise<WholesaleSearchHit[]>,
  options?: { skipIntlWholesale?: boolean },
): Promise<DiscoveredProductDraft[]> {
  const rawHits = [
    ...(await extraSearch(query)),
    ...(options?.skipIntlWholesale ? [] : await searchInternationalWholesale(query)),
  ];
  const seen = new Set<string>();
  const hits = rawHits.filter((h) => {
    if (seen.has(h.url)) return false;
    seen.add(h.url);
    return true;
  });
  backfillHitPricesFromText(hits, query);

  const candidates = hits
    .filter((h) => isIntlProductDetailCandidate(h, query))
    .sort((a, b) => {
      const rank = (h: WholesaleSearchHit) => {
        if (hasListedPrice(h, query)) return 0;
        if (isWholesaleProductDetailUrl(h.url)) return 1;
        return 2;
      };
      const rankDiff = rank(a) - rank(b);
      if (rankDiff !== 0) return rankDiff;
      const aMic = a.domain.includes("made-in-china") ? 0 : a.domain.includes("alibaba.com") ? 2 : 1;
      const bMic = b.domain.includes("made-in-china") ? 0 : b.domain.includes("alibaba.com") ? 2 : 1;
      return aMic - bMic;
    });

  const drafts: DiscoveredProductDraft[] = [];

  for (const hit of candidates.slice(0, 8)) {
    if (!hasListedPrice(hit, query)) continue;
    const draft = mapHitToDraft(hit, query, drafts.length, hits);
    if (draft) drafts.push(draft);
    if (drafts.length >= MIN_PRODUCTS) break;
  }

  const needsEnrich = candidates
    .filter((h) => !hasListedPrice(h, query))
    .filter((h) => h.domain.includes("made-in-china.com"))
    .slice(0, 3);
  const enriched = await Promise.all(
    needsEnrich.map(async (hit) => ({ hit, data: await enrichListingFromUrl(hit.url) })),
  );

  for (const { hit, data } of enriched) {
    if (!data?.priceZar || !isPlausibleWholesalePrice(query, data.priceZar)) continue;
    if (!data.title || isJunkProductTitle(data.title)) continue;
    hit.title = data.title;
    mergeEnrichedListingIntoHit(hit, data);
    hit.listingImageUrl = data.imageUrl ?? hit.listingImageUrl;
    hit.listingDescription = data.description ?? hit.listingDescription;
    hit.listingSummary = data.summary ?? hit.listingSummary;
    hit.listingHighlights = data.highlights ?? hit.listingHighlights;
    hit.snippet = data.summary ?? data.description?.slice(0, 200) ?? data.title;
    const draft = mapHitToDraft(hit, query, drafts.length, hits);
    if (draft) drafts.push(draft);
    if (drafts.length >= MIN_PRODUCTS) break;
  }

  return filterPublishableDrafts(drafts, query);
}

export async function draftsFromDeepEnrichment(
  hits: WholesaleSearchHit[],
  query: string,
): Promise<DiscoveredProductDraft[]> {
  const limit = isLowCostConsumableQuery(query) ? 12 : isSoftGoodsQuery(query) ? 10 : 6;
  const candidates = pickRelevantHits(query, hits)
    .sort((a, b) => {
      const aProduct = isProductPageUrl(a.url) ? 0 : 1;
      const bProduct = isProductPageUrl(b.url) ? 0 : 1;
      if (aProduct !== bProduct) return aProduct - bProduct;
      return (a.estimatedPriceZar ?? Number.MAX_SAFE_INTEGER) - (b.estimatedPriceZar ?? Number.MAX_SAFE_INTEGER);
    })
    .slice(0, limit);

  for (const hit of candidates) {
    if (hasListedPrice(hit, query)) continue;
    const data = await enrichListingFromUrl(hit.url);
    if (!data?.priceZar) continue;
    hit.title = data.title || hit.title;
    mergeEnrichedListingIntoHit(hit, data);
    hit.listingImageUrl = data.imageUrl ?? hit.listingImageUrl;
    hit.listingDescription = data.description ?? hit.listingDescription;
    hit.listingSummary = data.summary ?? hit.listingSummary;
    hit.listingHighlights = data.highlights ?? hit.listingHighlights;
    hit.snippet = data.summary ?? data.description?.slice(0, 200) ?? data.title;
  }

  const priced = candidates.filter((h) => hasListedPrice(h, query));
  if (!priced.length) return [];

  return draftsFromHits(sortBySaWholesaleFirst(priced), query, hits, MAX_PRODUCTS).slice(0, MAX_PRODUCTS);
}

export function buildResearchPrompt(query: string, hits: WholesaleSearchHit[]): string {
  const hitLines = hits.map(
    (h, i) =>
      `[${i}] ${h.title}\n    URL: ${h.url}\n    Region: ${h.region} | Tier: ${h.tier}\n    Est. cost: ${h.estimatedPriceZar ? `R${h.estimatedPriceZar}` : h.estimatedPriceUsd ? `$${h.estimatedPriceUsd}` : "unknown"}\n    ${h.snippet.slice(0, 160)}`,
  );

  return `Customer search: "${query}"

Wholesale research hits (${hits.length} found, South African suppliers first):
${hitLines.join("\n\n")}

Return 2-5 purchasable product options using ONLY these research hits.
Every option MUST cite supplier_hit_index for a hit that includes an estimated cost (R or $) in the list above — never invent a price.
For electronics and devices widely sold in South Africa, every option MUST use a South African .co.za trade supplier from the hits above — do not invent overseas suppliers.
For apparel, sleepwear, lingerie, and soft goods, prefer South African .co.za wholesalers and importers from the hits above before any international source.
Use supplier_hit_index to point at the exact hit. Prefer original/genuine stock from authorised SA distributors and importers.`;
}
