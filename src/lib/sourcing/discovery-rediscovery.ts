import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { isValidProductName } from "@/lib/sourcing/wholesale-supplier-search";
import { isRelevantProductHit } from "@/lib/sourcing/query-relevance";
import { isBoilerplateDescription, parseProductEnrichment } from "@/types/product-enrichment";
import { isPollutedListingCopy } from "@/lib/sourcing/listing-copy-sanitizer";
import { isInvalidProductImageUrl } from "@/lib/sourcing/product-image-url";

export async function productsNeedRediscovery(slugs: string[], query: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = createServiceClient();
  for (const slug of slugs) {
    const { data } = await supabase
      .from("products")
      .select("source_url, name, description, retail_price, image_url, enhanced_image_url, metadata")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) continue;

    const sourceUrl = (data.source_url as string | null) ?? "";
    if (!sourceUrl || sourceUrl.includes("almostanything.store/sourced")) return true;

    const name = (data.name as string | null) ?? "";
    if (!isValidProductName(name) || /\.(co\.za|com)\//i.test(name)) return true;

    if (!isRelevantProductHit(query, name, String(data.description ?? ""), slug)) return true;

    const retail = Number(data.retail_price) || 0;
    if (retail > 0 && retail < 25) return true;

    const image = (data.enhanced_image_url ?? data.image_url) as string | null;
    if (isInvalidProductImageUrl(image)) return true;

    const enrichment = parseProductEnrichment(data.metadata);
    const highlights = enrichment.highlights.filter((h) => h.trim().length > 0);
    const hasRealHighlights = highlights.some(
      (h) => !/trade supplier|wholesale source|tier pricing|cost base/i.test(h.trim()),
    );
    if (!hasRealHighlights && (!data.description || isBoilerplateDescription(String(data.description)))) {
      return true;
    }
    if (
      typeof data.description === "string" &&
      (data.description.includes("sourced at trade pricing from a South African supplier") ||
        data.description.includes("sourced from a South African supplier listing") ||
        isPollutedListingCopy(data.description))
    ) {
      return true;
    }
    if (highlights.some((h) => isPollutedListingCopy(h))) return true;
    if (!enrichment.supplierIntel?.primary?.supplierUrl) return true;
  }

  return false;
}
