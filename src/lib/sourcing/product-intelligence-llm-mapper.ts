import { resolveProductCategory } from "@/lib/catalog/category-resolver";
import { ensureVariantStock } from "@/lib/catalog/product-stock-label";
import { deliveryDaysForSupplierRegion } from "@/config/delivery";
import {
  containsSearchSnippetJunk,
  isPollutedListingCopy,
} from "@/lib/sourcing/listing-copy-sanitizer";
import {
  isAccessoryListing,
  isCatalogPageTitle,
  isNonProductListing,
  isPlausibleWholesalePrice,
  isSoftGoodsQuery,
  isSpecificIntlProductTitle,
  normalizeCustomerProductTitle,
  productNameMatchesQuery,
  zarFromUsd,
} from "@/lib/sourcing/wholesale-listing-quality";
import {
  applyAttributeValidation,
  cleanListingField,
  customerFacingListingCopy,
  sanitizeHighlightBullets,
} from "@/lib/sourcing/product-intelligence-mapper-utils";
import {
  type DiscoveredProductDraft,
  humanize,
  slugify,
} from "@/lib/sourcing/product-intelligence-types";
import {
  isSaCommonlyStockedProduct,
  isSaSupplierHit,
  isSaSupplierUrl,
  prefersSaWarehouse,
} from "@/lib/sourcing/wholesale-sa-priority";
import {
  buildSupplierIntel,
  isJunkProductTitle,
  isValidProductName,
} from "@/lib/sourcing/wholesale-supplier-search";
import type { ProductVariantsConfig } from "@/types/product-variants";
import { buildVariantMatrix } from "@/types/product-variants";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

export function mapLlmProduct(
  raw: Record<string, unknown>,
  query: string,
  hits: WholesaleSearchHit[],
): DiscoveredProductDraft | null {
  const hitIndex = Number(raw.supplier_hit_index);
  const matchedHit = Number.isFinite(hitIndex) && hits[hitIndex] ? hits[hitIndex] : null;

  const supplierName =
    typeof raw.supplier_name === "string"
      ? raw.supplier_name
      : matchedHit?.domain.replace(/^www\./, "") ?? hits[0]?.domain.replace(/^www\./, "") ?? "Trade supplier";

  const rawName = typeof raw.name === "string" ? raw.name : null;
  const name = rawName ? normalizeCustomerProductTitle(query, rawName) : null;
  if (!name) return null;

  const optionsRaw = Array.isArray(raw.options) ? raw.options : [];
  const options: ProductVariantsConfig["options"] = optionsRaw
    .map((o) => {
      if (!o || typeof o !== "object") return null;
      const opt = o as Record<string, unknown>;
      const optName = typeof opt.name === "string" ? opt.name : "";
      const values = Array.isArray(opt.values)
        ? opt.values.filter((v): v is string => typeof v === "string")
        : [];
      if (!optName || !values.length) return null;
      return { name: optName, values };
    })
    .filter((o): o is ProductVariantsConfig["options"][0] => o !== null);

  const colours = Array.isArray(raw.colours)
    ? raw.colours.filter((c): c is string => typeof c === "string")
    : [];
  const sizes = Array.isArray(raw.sizes)
    ? raw.sizes.filter((s): s is string => typeof s === "string")
    : [];

  if (!options.length && colours.length) options.push({ name: "Colour", values: colours });
  if (!options.some((o) => o.name === "Size") && sizes.length > 1) {
    options.push({ name: "Size", values: sizes });
  }

  const variants: ProductVariantsConfig = options.length
    ? ensureVariantStock({ options, variants: buildVariantMatrix(options) })
    : { options: [], variants: [] };

  const highlights = sanitizeHighlightBullets(
    Array.isArray(raw.highlights)
      ? raw.highlights.filter((h): h is string => typeof h === "string").map(humanize)
      : [],
  ).filter((h) => !containsSearchSnippetJunk(h) && !isPollutedListingCopy(h));

  const specifications: Record<string, string> = {};
  if (raw.specifications && typeof raw.specifications === "object") {
    for (const [k, v] of Object.entries(raw.specifications as Record<string, unknown>)) {
      if (typeof v === "string") specifications[k] = humanize(v);
    }
  }

  const supplierUrl =
    typeof raw.supplier_url === "string" && raw.supplier_url.startsWith("http")
      ? raw.supplier_url
      : matchedHit?.url ?? hits.find((h) => isSaSupplierHit(h))?.url ?? hits[0]?.url ?? "";

  if (!supplierUrl) return null;

  const saHits = hits.filter(isSaSupplierHit);
  if (prefersSaWarehouse(query) && saHits.length >= 1 && !isSaSupplierUrl(supplierUrl)) {
    return null;
  }
  if (isSaCommonlyStockedProduct(query) && saHits.length >= 2 && !isSaSupplierUrl(supplierUrl)) {
    return null;
  }
  if (isSaCommonlyStockedProduct(query) && saHits.length >= 1 && !matchedHit && !isSaSupplierUrl(supplierUrl)) {
    return null;
  }

  if (!isValidProductName(name)) return null;
  if (isJunkProductTitle(name) || isCatalogPageTitle(name)) return null;
  if (!productNameMatchesQuery(query, name)) return null;
  if (!matchedHit) return null;

  const hitIdx = hits.indexOf(matchedHit);
  const intel = buildSupplierIntel(query, hits, hitIdx >= 0 ? hitIdx : 0);

  if (isAccessoryListing(query, matchedHit.title, matchedHit.snippet)) return null;
  if (isNonProductListing(matchedHit.title, matchedHit.url, matchedHit.snippet)) {
    return null;
  }

  const description = customerFacingListingCopy(
    [
      typeof raw.description === "string" ? raw.description : undefined,
      typeof raw.summary === "string" ? raw.summary : undefined,
      matchedHit.listingDescription,
      matchedHit.listingSummary,
      matchedHit.snippet,
    ],
    name,
  );

  const basePrice =
    matchedHit.estimatedPriceZar && matchedHit.estimatedPriceZar > 0
      ? matchedHit.estimatedPriceZar
      : matchedHit.estimatedPriceUsd && matchedHit.estimatedPriceUsd > 0
        ? zarFromUsd(matchedHit.estimatedPriceUsd)
        : 0;
  if (!isPlausibleWholesalePrice(query, basePrice)) return null;

  return applyAttributeValidation(
    {
      name,
      slug: typeof raw.slug === "string" ? raw.slug : slugify(name),
      description: humanize(description),
      summary: humanize(
        cleanListingField(typeof raw.summary === "string" ? raw.summary : undefined, 140) ||
          (description.length > 140 ? `${name} — ready to order.` : description),
      ),
      category: resolveProductCategory(
        query,
        name,
        typeof raw.category === "string" ? raw.category : undefined,
      ),
      basePrice,
      supplierMoq: matchedHit.supplierMoq,
      priceVatStatus: matchedHit.priceVatStatus,
      supplierName,
      supplierUrl,
      deliveryDaysMin:
        Number(raw.delivery_days_min) ||
        deliveryDaysForSupplierRegion(matchedHit?.region).min,
      deliveryDaysMax:
        Number(raw.delivery_days_max) ||
        deliveryDaysForSupplierRegion(matchedHit?.region).max,
      rating:
        Number(raw.rating) > 0 && Number(raw.review_count) > 0 ? Number(raw.rating) : 0,
      reviewCount: Number(raw.review_count) > 0 ? Number(raw.review_count) : 0,
      highlights,
      specifications,
      colours,
      sizes,
      variants,
      candidateImageUrl:
        typeof raw.image_url === "string"
          ? raw.image_url
          : matchedHit?.listingImageUrl ?? hits[0]?.listingImageUrl,
      supplierIntel: intel ?? undefined,
    },
    query,
    matchedHit,
  );
}
