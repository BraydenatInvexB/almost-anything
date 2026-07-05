import { isPlausibleWholesalePrice } from "@/lib/sourcing/wholesale-listing-quality";
import { runSoftGoodsSaSearchPipeline } from "@/lib/sourcing/discovery-search-engine";
import { enrichListingFromUrl } from "@/lib/sourcing/listing-page-enricher";
import { MAX_PRODUCTS, MIN_PRODUCTS } from "@/lib/sourcing/product-intelligence-prompts";
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
  backfillHitPricesFromText,
  buildResearchPrompt,
  draftsFromDeepEnrichment,
  hasListedPrice,
  softGoodsIntlFallback,
} from "@/lib/sourcing/product-intelligence-fallbacks";
import { INTELLIGENCE_SYSTEM } from "@/lib/sourcing/product-intelligence-prompts";
import {
  finalizeSaFirstDrafts,
  isSaSupplierHit,
  isSaSupplierUrl,
  saResearchHits,
  sortBySaWholesaleFirst,
} from "@/lib/sourcing/wholesale-sa-priority";
import { isSaApparelWholesaleDomain, SA_SOFT_GOODS_SEED_URLS } from "@/lib/sourcing/wholesale-supplier-constants";
import { llmCompleteJson, llmConfigured } from "@/lib/sourcing/llm-client";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

async function buildSaSoftGoodsSeedDraft(query: string): Promise<DiscoveredProductDraft | null> {
  for (const seed of SA_SOFT_GOODS_SEED_URLS) {
    const data = await enrichListingFromUrl(seed.url);
    if (!data?.priceZar || !isPlausibleWholesalePrice(query, data.priceZar)) continue;

    const hit: WholesaleSearchHit = {
      title: data.title || seed.title,
      url: seed.url,
      snippet: data.summary ?? data.description?.slice(0, 200) ?? seed.title,
      domain: seed.domain,
      region: "south_africa",
      tier: "wholesale",
      score: 250,
      estimatedPriceZar: data.priceZar,
      listingImageUrl: data.imageUrl ?? undefined,
      listingDescription: data.description ?? undefined,
      listingSummary: data.summary ?? undefined,
      listingHighlights: data.highlights ?? undefined,
    };

    const draft = mapHitToDraft(hit, query, 0, [hit]);
    if (!draft) continue;
    const publishable = filterPublishableDrafts([draft], query);
    if (publishable.length) return publishable[0];
  }

  return null;
}

export async function discoverSoftGoods(query: string): Promise<DiscoveredProductDraft[]> {
  const hits = await runSoftGoodsSaSearchPipeline(query);
  backfillHitPricesFromText(hits, query);

  const saHits = sortBySaWholesaleFirst(
    pickRelevantHits(
      query,
      hits.filter((h) => isSaSupplierHit(h)),
    ),
  ).sort((a, b) => {
    const aTrade = isSaApparelWholesaleDomain(a.domain) ? 0 : 1;
    const bTrade = isSaApparelWholesaleDomain(b.domain) ? 0 : 1;
    if (aTrade !== bTrade) return aTrade - bTrade;
    return 0;
  });
  const allRelevant = pickRelevantHits(query, hits);

  const saPriced = saHits.filter((h) => hasListedPrice(h, query));
  if (saPriced.length >= MIN_PRODUCTS) {
    const mapped = saPriced
      .slice(0, MAX_PRODUCTS + 2)
      .map((hit, i) => mapHitToDraft(hit, query, i, hits))
      .filter((p): p is DiscoveredProductDraft => p !== null);
    const publishable = filterPublishableDrafts(mapped, query);
    if (publishable.length >= MIN_PRODUCTS) {
      return finalizeSaFirstDrafts(publishable, query, MAX_PRODUCTS);
    }
  }

  if (saHits.length) {
    const enrichedSa = await draftsFromDeepEnrichment(saHits, query);
    const saPublishable = filterPublishableDrafts(
      enrichedSa.filter((d) => isSaSupplierUrl(d.supplierUrl)),
      query,
    );
    if (saPublishable.length) {
      return finalizeSaFirstDrafts(saPublishable, query, MAX_PRODUCTS);
    }
  }

  const researchHits = saResearchHits(hits, query).filter((h) => hasListedPrice(h, query));
  if (llmConfigured() && researchHits.length >= 1) {
    const data = await llmCompleteJson(
      INTELLIGENCE_SYSTEM,
      buildResearchPrompt(query, researchHits),
      "anthropic",
    );
    const products = Array.isArray(data.products) ? data.products : [];
    const mapped = sortByWholesalePrice(
      products
        .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
        .map((p) => mapLlmProduct(p, query, researchHits))
        .filter((p): p is DiscoveredProductDraft => p !== null),
    );
    const saMapped = mapped.filter((d) => isSaSupplierUrl(d.supplierUrl));
    if (saMapped.length) {
      return finalizeSaFirstDrafts(filterPublishableDrafts(saMapped, query), query, MAX_PRODUCTS);
    }
  }

  const pricedAll = sortBySaWholesaleFirst(allRelevant.filter((h) => hasListedPrice(h, query)));
  if (pricedAll.length) {
    const drafts = filterPublishableDrafts(
      draftsFromHits(pricedAll, query, hits, MAX_PRODUCTS),
      query,
    );
    const saDrafts = drafts.filter((d) => isSaSupplierUrl(d.supplierUrl));
    if (saDrafts.length) {
      return finalizeSaFirstDrafts(saDrafts, query, MAX_PRODUCTS);
    }
  }

  const seedDraft = await buildSaSoftGoodsSeedDraft(query);
  if (seedDraft) {
    return finalizeSaFirstDrafts([seedDraft], query, MAX_PRODUCTS);
  }

  const intlDrafts = await softGoodsIntlFallback(query);
  if (intlDrafts.length) {
    return finalizeSaFirstDrafts(intlDrafts, query, MAX_PRODUCTS);
  }

  return [];
}
