import { isLowCostConsumableQuery, isSoftGoodsQuery } from "@/lib/sourcing/wholesale-listing-quality";
import {
  backfillHitPricesFromText,
  buildResearchPrompt,
  consumableIntlFallback,
  draftsFromDeepEnrichment,
  hasListedPrice,
} from "@/lib/sourcing/product-intelligence-fallbacks";
import { discoverSoftGoods } from "@/lib/sourcing/product-intelligence-soft-goods";
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
import {
  finalizeSaFirstDrafts,
  saResearchHits,
  sortBySaWholesaleFirst,
} from "@/lib/sourcing/wholesale-sa-priority";
import { searchWholesaleSuppliers } from "@/lib/sourcing/wholesale-supplier-search";
import { llmCompleteJson, llmConfigured } from "@/lib/sourcing/llm-client";

export type { DiscoveredProductDraft } from "@/lib/sourcing/product-intelligence-mappers";

export async function extractProductIntelligence(query: string): Promise<DiscoveredProductDraft[]> {
  const trimmed = query.trim();

  if (isSoftGoodsQuery(trimmed)) {
    return discoverSoftGoods(trimmed);
  }

  const hits = await searchWholesaleSuppliers(trimmed, { maxResults: 12 });
  backfillHitPricesFromText(hits, trimmed);
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
