import { isValidProductName, searchWholesaleSuppliers } from "@/lib/sourcing/wholesale-supplier-search";
import { llmCompleteJson, llmConfigured } from "@/lib/sourcing/llm-client";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";
import {
  INTELLIGENCE_SYSTEM,
  MAX_PRODUCTS,
  MIN_PRODUCTS,
} from "@/lib/sourcing/product-intelligence-prompts";
import {
  type DiscoveredProductDraft,
  draftsFromHits,
  mapHitToDraft,
  mapLlmProduct,
  pickRelevantHits,
  sortByRelevanceThenPrice,
  sortByWholesalePrice,
} from "@/lib/sourcing/product-intelligence-mappers";

export type { DiscoveredProductDraft } from "@/lib/sourcing/product-intelligence-mappers";

function buildResearchPrompt(query: string, hits: WholesaleSearchHit[]): string {
  const hitLines = hits.map(
    (h, i) =>
      `[${i}] ${h.title}\n    URL: ${h.url}\n    Region: ${h.region} | Tier: ${h.tier}\n    Est. cost: ${h.estimatedPriceZar ? `R${h.estimatedPriceZar}` : h.estimatedPriceUsd ? `$${h.estimatedPriceUsd}` : "unknown"}\n    ${h.snippet.slice(0, 160)}`,
  );

  return `Customer search: "${query}"

Wholesale research hits (${hits.length} found, cheapest first):
${hitLines.join("\n\n")}

Return 2-5 purchasable product options using these wholesale sources. Use different hits for different options when possible.`;
}

export async function extractProductIntelligence(query: string): Promise<DiscoveredProductDraft[]> {
  const trimmed = query.trim();
  const hits = await searchWholesaleSuppliers(trimmed, { maxResults: 12 });

  const enrichedSaHits = pickRelevantHits(
    trimmed,
    hits.filter(
      (h) =>
        h.region === "south_africa" &&
        h.estimatedPriceZar &&
        h.estimatedPriceZar >= 15 &&
        isValidProductName(h.title),
    ),
  );

  if (enrichedSaHits.length >= MIN_PRODUCTS) {
    return sortByRelevanceThenPrice(enrichedSaHits)
      .slice(0, MAX_PRODUCTS + 2)
      .map((hit, i) => mapHitToDraft(hit, trimmed, i, hits))
      .filter((p): p is DiscoveredProductDraft => p !== null)
      .slice(0, MAX_PRODUCTS);
  }

  if (llmConfigured() && hits.length > 0) {
    const data = await llmCompleteJson(
      INTELLIGENCE_SYSTEM,
      buildResearchPrompt(trimmed, hits),
      "anthropic",
    );
    const products = Array.isArray(data.products) ? data.products : [];

    const mapped = sortByWholesalePrice(
      products
        .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
        .map((p) => mapLlmProduct(p, trimmed, hits))
        .filter((p): p is DiscoveredProductDraft => p !== null),
    );

    if (mapped.length >= 1) {
      return mapped.slice(0, MAX_PRODUCTS);
    }
  }

  if (hits.length >= MIN_PRODUCTS) {
    return draftsFromHits(hits, trimmed, hits, MAX_PRODUCTS).slice(0, MAX_PRODUCTS);
  }

  if (hits.length === 1) {
    const single = mapHitToDraft(hits[0], trimmed, 0, hits);
    return single ? [single] : [];
  }

  if (llmConfigured()) {
    const data = await llmCompleteJson(INTELLIGENCE_SYSTEM, trimmed, "anthropic");
    const products = Array.isArray(data.products) ? data.products : [];
    const mapped = products
      .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
      .map((p) => mapLlmProduct(p, trimmed, hits))
      .filter((p): p is DiscoveredProductDraft => p !== null);
    if (mapped.length) return sortByWholesalePrice(mapped).slice(0, MAX_PRODUCTS);
  }

  return [];
}
