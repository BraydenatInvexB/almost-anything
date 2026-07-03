import "server-only";

import { classifyDomains, rootDomain } from "@/lib/sourcing/advanced/domain-classifier";
import {
  isGoogleSearchConfigured,
  searchNewOldStock,
  searchProductIntl,
  searchProductZA,
  type WebSearchResult,
} from "@/lib/sourcing/advanced/google-search";
import {
  extractProductFromPage,
  toWholesaleSearchHit,
} from "@/lib/sourcing/advanced/page-extractor";
import type { ParsedQuery } from "@/lib/sourcing/advanced/query-parser";
import type { AdvancedSourceRegion } from "@/lib/sourcing/advanced/types";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

const MIN_CONFIDENCE = 0.55;
const MAX_PAGES_PER_PASS = 6;

async function runGooglePass(
  query: string,
  searchResults: WebSearchResult[],
  region: AdvancedSourceRegion,
  parsedQuery: ParsedQuery,
): Promise<WholesaleSearchHit[]> {
  if (!searchResults.length) return [];

  const urls = searchResults.map((r) => r.link);
  const domainMap = await classifyDomains(urls);

  const ranked = searchResults
    .map((r) => {
      const domain = rootDomain(new URL(r.link).hostname);
      const classification = domainMap.get(domain);
      return { searchResult: r, domain, classification };
    })
    .filter((r) => r.classification !== undefined)
    .sort((a, b) => a.classification!.tier - b.classification!.tier)
    .slice(0, MAX_PAGES_PER_PASS);

  const extracted = await Promise.allSettled(
    ranked.map(async ({ searchResult, classification, domain }) => {
      const page = await extractProductFromPage(searchResult.link, query, parsedQuery);
      if (!page) return null;
      if ((page.confidence ?? 0) < MIN_CONFIDENCE) return null;
      if (page.inStock === false) return null;
      return toWholesaleSearchHit(
        searchResult.link,
        page,
        classification!.supplierType,
        region,
        domain,
      );
    }),
  );

  const hits: WholesaleSearchHit[] = [];
  for (const outcome of extracted) {
    if (outcome.status === "fulfilled" && outcome.value) hits.push(outcome.value);
  }
  return hits;
}

/**
 * Google Search grounding (Gemini) + structured-data page extraction cascade.
 * Runs when GOOGLE_API_KEY (or GEMINI_API_KEY) is configured.
 */
export async function runAdvancedGoogleSearchPipeline(
  query: string,
  parsedQuery: ParsedQuery,
): Promise<WholesaleSearchHit[]> {
  if (!isGoogleSearchConfigured()) return [];

  const searchQuery = parsedQuery.canonicalProduct || query;

  let hits = await runGooglePass(
    searchQuery,
    await searchProductZA(searchQuery),
    "ZA",
    parsedQuery,
  );

  if (!hits.length) {
    hits = await runGooglePass(
      searchQuery,
      await searchProductIntl(searchQuery),
      "INTL",
      parsedQuery,
    );
  }

  if (!hits.length) {
    hits = await runGooglePass(
      searchQuery,
      await searchNewOldStock(searchQuery, "ZA"),
      "ZA",
      parsedQuery,
    );
  }

  if (!hits.length) {
    hits = await runGooglePass(
      searchQuery,
      await searchNewOldStock(searchQuery, "INTL"),
      "INTL",
      parsedQuery,
    );
  }

  return hits;
}

export { isGoogleSearchConfigured };
