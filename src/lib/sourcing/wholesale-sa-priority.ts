import { isSoftGoodsQuery } from "@/lib/sourcing/wholesale-listing-quality";
import type { DiscoveredProductDraft } from "@/lib/sourcing/product-intelligence-mappers";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

/** Products widely distributed through SA trade channels — skip overseas unless SA is empty. */
export function isSaCommonlyStockedProduct(query: string): boolean {
  return /\b(ipad|iphone|airpods?|apple\s*watch|macbook|airpods?|samsung\s*galaxy|galaxy\s*tab|tablet|smartphone|ps5|playstation|xbox|nintendo\s*switch|laptop|notebook|smart\s*tv)\b/i.test(
    query,
  );
}

/** Prefer SA warehouse sourcing when local trade listings exist (electronics + apparel). */
export function prefersSaWarehouse(query: string): boolean {
  return isSaCommonlyStockedProduct(query) || isSoftGoodsQuery(query);
}

export function isSaSupplierHit(hit: WholesaleSearchHit): boolean {
  return hit.region === "south_africa" || hit.domain.includes(".co.za");
}

export function isSaSupplierUrl(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().endsWith(".co.za");
  } catch {
    return false;
  }
}

/** Raw SA hits before enrich — if enough, skip international web search entirely. */
export function shouldSearchInternational(saRawHits: WholesaleSearchHit[], query: string): boolean {
  const saHits = saRawHits.filter(isSaSupplierHit);
  const saPriced = saHits.filter(
    (h) => (h.estimatedPriceZar && h.estimatedPriceZar > 0) || (h.estimatedPriceUsd && h.estimatedPriceUsd > 0),
  );

  if (prefersSaWarehouse(query)) {
    if (saPriced.length >= 1) return false;
    if (saHits.length >= 3) return false;
    return saHits.length < 2;
  }

  if (!isSaCommonlyStockedProduct(query)) return true;
  return saHits.length < 4;
}

export function sortBySaWholesaleFirst(hits: WholesaleSearchHit[]): WholesaleSearchHit[] {
  return [...hits].sort((a, b) => {
    const saA = isSaSupplierHit(a) ? 0 : 1;
    const saB = isSaSupplierHit(b) ? 0 : 1;
    if (saA !== saB) return saA - saB;
    const priceA = a.estimatedPriceZar ?? (a.estimatedPriceUsd ? a.estimatedPriceUsd * 18.5 : Number.MAX_SAFE_INTEGER);
    const priceB = b.estimatedPriceZar ?? (b.estimatedPriceUsd ? b.estimatedPriceUsd * 18.5 : Number.MAX_SAFE_INTEGER);
    if (priceA !== priceB) return priceA - priceB;
    return b.score - a.score;
  });
}

export function saResearchHits(hits: WholesaleSearchHit[], query: string): WholesaleSearchHit[] {
  const priced = hits.filter(
    (h) =>
      (h.estimatedPriceZar && h.estimatedPriceZar > 0) ||
      (h.estimatedPriceUsd && h.estimatedPriceUsd > 0),
  );
  const pool = priced.length >= 2 ? priced : hits;
  const sa = pool.filter(isSaSupplierHit);
  if (prefersSaWarehouse(query) && sa.length >= 1) return sa;
  if (isSaCommonlyStockedProduct(query) && sa.length >= 2) return sa;
  return pool;
}

export function finalizeSaFirstDrafts(
  drafts: DiscoveredProductDraft[],
  query: string,
  maxProducts: number,
): DiscoveredProductDraft[] {
  if (!prefersSaWarehouse(query)) return drafts.slice(0, maxProducts);

  const sa = drafts.filter((d) => isSaSupplierUrl(d.supplierUrl));
  const intl = drafts.filter((d) => !isSaSupplierUrl(d.supplierUrl));

  if (sa.length >= maxProducts) return sa.slice(0, maxProducts);
  if (sa.length >= 2) return sa.slice(0, maxProducts);
  return [...sa, ...intl].slice(0, maxProducts);
}
