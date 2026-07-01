import { significantSearchTokens } from "@/lib/sourcing/query-relevance";
import {
  CONSUMABLE_INTL_TIERS,
  INTL_PRICE_TIERS,
  INTL_WHOLESALE_TIERS,
  SA_PRICE_TIERS,
  SA_WHOLESALE_TIERS,
  type SearchTier,
} from "@/lib/sourcing/wholesale-supplier-constants";
import { fetchDuckDuckGoMarkdown } from "@/lib/sourcing/wholesale-supplier-fetch";
import { parseSearchResults } from "@/lib/sourcing/wholesale-supplier-parse";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

async function searchTiers(query: string, tiers: SearchTier[]): Promise<WholesaleSearchHit[]> {
  const core = significantSearchTokens(query).join(" ") || query.trim();
  const hits: WholesaleSearchHit[] = [];

  const pages = await Promise.all(
    tiers.map(async (tier) => ({
      tier,
      markdown: await fetchDuckDuckGoMarkdown(tier.query(core)),
    })),
  );

  for (const { tier, markdown } of pages) {
    if (!markdown) continue;
    hits.push(...parseSearchResults(markdown, tier, query));
  }

  return hits;
}

/** Open-web search for SA trade / wholesale suppliers (.co.za distributors, importers). */
export async function searchSaWholesaleSuppliers(query: string): Promise<WholesaleSearchHit[]> {
  return searchTiers(query, SA_WHOLESALE_TIERS);
}

/** International manufacturer / wholesale platforms (Alibaba, factories, etc.). */
export async function searchInternationalWholesale(query: string): Promise<WholesaleSearchHit[]> {
  return searchTiers(query, INTL_WHOLESALE_TIERS);
}

/** SA trade listings with explicit ZAR / VAT price signals in search snippets. */
export async function searchSaTradePriceListings(query: string): Promise<WholesaleSearchHit[]> {
  return searchTiers(query, SA_PRICE_TIERS);
}

/** Extra international product-detail search for stationery, tools, and other low-cost SKUs. */
export async function searchConsumableIntlProducts(query: string): Promise<WholesaleSearchHit[]> {
  return searchTiers(query, CONSUMABLE_INTL_TIERS);
}

/** International B2B listings biased toward unit / FOB prices in snippets. */
export async function searchInternationalTradePriceListings(query: string): Promise<WholesaleSearchHit[]> {
  return searchTiers(query, INTL_PRICE_TIERS);
}
