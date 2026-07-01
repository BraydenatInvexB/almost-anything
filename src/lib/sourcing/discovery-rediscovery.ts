import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { isValidProductName, isJunkProductTitle } from "@/lib/sourcing/wholesale-supplier-search";
import {
  isBadStoredDiscoveryProduct,
  isCatalogPageTitle,
  isPlausibleWholesalePrice,
  isSupplierBrandedCatalogTitle,
  productNameIncludesSupplier,
  productNameMatchesQuery,
} from "@/lib/sourcing/wholesale-listing-quality";
import { isSaCommonlyStockedProduct, isSaSupplierUrl } from "@/lib/sourcing/wholesale-sa-priority";
import { isRelevantProductHit } from "@/lib/sourcing/query-relevance";
import { containsSearchSnippetJunk, isPollutedListingCopy } from "@/lib/sourcing/listing-copy-sanitizer";

/** Only purge listings that are genuinely unusable — cosmetic issues are repaired in place. */
export async function productsNeedRediscovery(slugs: string[], query: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = createServiceClient();
  for (const slug of slugs) {
    const { data } = await supabase
      .from("products")
      .select("source_url, name, description, retail_price")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) continue;

    const name = (data.name as string | null) ?? "";
    const description = String(data.description ?? "");
    const sourceUrl = (data.source_url as string | null) ?? "";
    const retail = Number(data.retail_price) || 0;

    if (retail <= 0) return true;
    if (!isPlausibleWholesalePrice(query, retail * 0.9)) return true;
    if (isJunkProductTitle(name)) return true;
    if (isCatalogPageTitle(name)) return true;
    if (isSupplierBrandedCatalogTitle(name, sourceUrl)) return true;
    if (!productNameMatchesQuery(query, name)) return true;

    if (
      isBadStoredDiscoveryProduct({
        name,
        description,
        sourceUrl,
        retailPrice: retail,
        query,
      })
    ) {
      return true;
    }

    if (isSaCommonlyStockedProduct(query) && !isSaSupplierUrl(sourceUrl)) return true;
    if (productNameIncludesSupplier(name)) return true;
    if (!sourceUrl || sourceUrl.includes("almostanything.store/sourced")) return true;
    if (!isValidProductName(name) || /\.(co\.za|com)\//i.test(name)) return true;
    if (!isRelevantProductHit(query, name, description, slug)) return true;
    if (isPollutedListingCopy(description) || containsSearchSnippetJunk(description)) return true;
  }

  return false;
}
