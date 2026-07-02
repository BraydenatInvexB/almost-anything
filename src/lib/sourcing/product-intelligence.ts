import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";
import { isLowCostConsumableQuery, isPlausibleWholesalePrice, isWholesaleProductDetailUrl } from "@/lib/sourcing/wholesale-listing-quality";
import { isRelevantProductHit } from "@/lib/sourcing/query-relevance";
import {
  searchConsumableIntlProducts,
  searchInternationalWholesale,
} from "@/lib/sourcing/wholesale-supplier-sa-search";
import { isJunkProductTitle } from "@/lib/sourcing/wholesale-supplier-url";
import { isProductPageUrl, searchWholesaleSuppliers } from "@/lib/sourcing/wholesale-supplier-search";
import {
  INTELLIGENCE_SYSTEM,
  MAX_PRODUCTS,
  MIN_PRODUCTS,
} from "@/lib/sourcing/product-intelligence-prompts";
import {
  type DiscoveredProductDraft,
  draftsFromHits,
  filterPublishableDrafts,
  mapHitToDraft,
  mapLlmProduct,
  pickRelevantHits,
  sortByWholesalePrice,
} from "@/lib/sourcing/product-intelligence-mappers";
import { enrichListingFromUrl, mergeEnrichedListingIntoHit } from "@/lib/sourcing/listing-page-enricher";
import {
  finalizeSaFirstDrafts,
  saResearchHits,
  sortBySaWholesaleFirst,
} from "@/lib/sourcing/wholesale-sa-priority";
import { llmCompleteJson, llmConfigured } from "@/lib/sourcing/llm-client";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

export type { DiscoveredProductDraft } from "@/lib/sourcing/product-intelligence-mappers";

function minListedPrice(query: string): number {
  if (/\b(pencil|pen|stationery|notebook|eraser)\b/i.test(query)) return 8;
  return 15;
}

function hasListedPrice(hit: WholesaleSearchHit, query: string): boolean {
  const floor = minListedPrice(query);
  if (hit.estimatedPriceZar != null && hit.estimatedPriceZar >= floor) return true;
  if (hit.estimatedPriceUsd != null && hit.estimatedPriceUsd > 0) {
    const zar = Math.round(hit.estimatedPriceUsd * ZAR_PER_USD * 100) / 100;
    if (zar >= floor) return true;
    if (isLowCostConsumableQuery(query) && hit.estimatedPriceUsd >= 0.1) return true;
  }
  return false;
}

export async function consumableIntlFallback(query: string): Promise<DiscoveredProductDraft[]> {
  const rawHits = [
    ...(await searchConsumableIntlProducts(query)),
    ...(await searchInternationalWholesale(query)),
  ];
  const seen = new Set<string>();
  const hits = rawHits.filter((h) => {
    if (seen.has(h.url)) return false;
    seen.add(h.url);
    return true;
  });

  const candidates = hits
    .filter(
      (h) =>
        isWholesaleProductDetailUrl(h.url) &&
        isRelevantProductHit(query, h.title, h.snippet, h.url, 8),
    )
    .sort((a, b) => {
      const rank = (h: WholesaleSearchHit) =>
        h.domain.includes("made-in-china") ? 0 : h.domain.includes("alibaba.com") ? 2 : 1;
      return rank(a) - rank(b);
    });

  const drafts: DiscoveredProductDraft[] = [];
  const enriched = await Promise.all(
    candidates.slice(0, 5).map(async (hit) => ({ hit, data: await enrichListingFromUrl(hit.url) })),
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

async function draftsFromDeepEnrichment(
  hits: WholesaleSearchHit[],
  query: string,
): Promise<DiscoveredProductDraft[]> {
  const limit = isLowCostConsumableQuery(query) ? 12 : 6;
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

  return draftsFromHits(sortBySaWholesaleFirst(priced), query, hits, MAX_PRODUCTS).slice(
    0,
    MAX_PRODUCTS,
  );
}

function buildResearchPrompt(query: string, hits: WholesaleSearchHit[]): string {
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
Use supplier_hit_index to point at the exact hit. Prefer original/genuine stock from authorised SA distributors and importers.`;
}

export async function extractProductIntelligence(query: string): Promise<DiscoveredProductDraft[]> {
  const trimmed = query.trim();
  const hits = await searchWholesaleSuppliers(trimmed, { maxResults: 12 });
  const debug = process.env.DISCOVERY_DEBUG === "1";

  if (debug) {
    console.error("[intelligence] hits", hits.length, hits.slice(0, 3).map((h) => h.title));
  }

  const pricedHits = pickRelevantHits(
    trimmed,
    hits.filter((h) => hasListedPrice(h, trimmed)),
  );

  if (pricedHits.length >= MIN_PRODUCTS) {
    const mapped = sortBySaWholesaleFirst(pricedHits)
      .slice(0, MAX_PRODUCTS + 2)
      .map((hit, i) => mapHitToDraft(hit, trimmed, i, hits))
      .filter((p): p is DiscoveredProductDraft => p !== null)
      .slice(0, MAX_PRODUCTS);
    if (mapped.length >= MIN_PRODUCTS) {
      return finalizeSaFirstDrafts(filterPublishableDrafts(mapped, trimmed), trimmed, MAX_PRODUCTS);
    }
  }

  const researchHits = saResearchHits(hits, trimmed).filter((h) => hasListedPrice(h, trimmed));

  if (llmConfigured() && researchHits.length >= 1) {
    const data = await llmCompleteJson(
      INTELLIGENCE_SYSTEM,
      buildResearchPrompt(trimmed, researchHits),
      "anthropic",
    );
    const products = Array.isArray(data.products) ? data.products : [];

    const mapped = sortByWholesalePrice(
      products
        .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
        .map((p) => mapLlmProduct(p, trimmed, researchHits))
        .filter((p): p is DiscoveredProductDraft => p !== null),
    );

    const minAccept = researchHits.length >= MIN_PRODUCTS ? 1 : MIN_PRODUCTS;
    if (mapped.length >= minAccept) {
      return finalizeSaFirstDrafts(filterPublishableDrafts(mapped, trimmed), trimmed, MAX_PRODUCTS);
    }
  }

  const pricedHitsAll = hits.filter((h) => hasListedPrice(h, trimmed));

  if (pricedHitsAll.length >= MIN_PRODUCTS) {
    return finalizeSaFirstDrafts(
      filterPublishableDrafts(
        draftsFromHits(sortBySaWholesaleFirst(pricedHitsAll), trimmed, hits, MAX_PRODUCTS).slice(
          0,
          MAX_PRODUCTS,
        ),
        trimmed,
      ),
      trimmed,
      MAX_PRODUCTS,
    );
  }

  if (hits.length >= 1) {
    const enriched = await draftsFromDeepEnrichment(hits, trimmed);
    const publishable = filterPublishableDrafts(enriched, trimmed);
    if (publishable.length) {
      return finalizeSaFirstDrafts(publishable, trimmed, MAX_PRODUCTS);
    }

    const single = mapHitToDraft(hits[0], trimmed, 0, hits);
    const singlePublishable = single ? filterPublishableDrafts([single], trimmed) : [];
    if (singlePublishable.length) return singlePublishable;
  }

  if (isLowCostConsumableQuery(trimmed)) {
    const fallback = await consumableIntlFallback(trimmed);
    if (fallback.length) {
      return finalizeSaFirstDrafts(fallback, trimmed, MAX_PRODUCTS);
    }
  }

  if (debug) console.error("[intelligence] no drafts for", trimmed, "from", hits.length, "hits");
  return [];
}
