import { resolveProductCategory } from "@/lib/catalog/category-resolver";
import { deliveryDaysForSupplierRegion } from "@/config/delivery";
import {
  containsSearchSnippetJunk,
  isPollutedListingCopy,
} from "@/lib/sourcing/listing-copy-sanitizer";
import {
  isAccessoryListing,
  isCatalogPageTitle,
  isSupplierBrandedCatalogTitle,
  isNonProductListing,
  isPlausibleWholesalePrice,
  isSoftGoodsQuery,
  isSpecificIntlProductTitle,
  normalizeCustomerProductTitle,
  productNameMatchesQuery,
  refineProductTitle,
  zarFromUsd,
} from "@/lib/sourcing/wholesale-listing-quality";
import { isSaApparelWholesaleDomain } from "@/lib/sourcing/wholesale-supplier-constants";
import { isRelevantProductHit } from "@/lib/sourcing/query-relevance";
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
  buildSupplierIntel,
  isJunkProductTitle,
  isRetailPriceSource,
  isValidProductName,
} from "@/lib/sourcing/wholesale-supplier-search";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

export function mapHitToDraft(
  hit: WholesaleSearchHit,
  query: string,
  index: number,
  allHits: WholesaleSearchHit[],
): DiscoveredProductDraft | null {
  const rawTitle = hit.title.slice(0, 120) || query;
  const listingSnippet = hit.listingSummary ?? hit.listingDescription ?? hit.snippet;
  const saApparelWholesale =
    isSoftGoodsQuery(query) && isSaApparelWholesaleDomain(hit.domain);
  if (isAccessoryListing(query, rawTitle, listingSnippet)) return null;
  if (
    isNonProductListing(rawTitle, hit.url, listingSnippet) &&
    !(isSoftGoodsQuery(query) && isSpecificIntlProductTitle(rawTitle, listingSnippet)) &&
    !saApparelWholesale
  ) {
    return null;
  }
  if (isCatalogPageTitle(rawTitle) && !saApparelWholesale) return null;
  if (isSupplierBrandedCatalogTitle(rawTitle, hit.domain) && !saApparelWholesale) return null;
  if (!isValidProductName(rawTitle)) return null;
  if (isRetailPriceSource(hit.domain) || hit.tier === "retail") return null;

  const listingName = refineProductTitle(query, rawTitle, listingSnippet);
  const relevant =
    isRelevantProductHit(query, rawTitle, hit.snippet, hit.url) ||
    (isSoftGoodsQuery(query) && productNameMatchesQuery(query, listingName));
  if (!relevant) return null;

  let title = listingName;
  if (isJunkProductTitle(title) && productNameMatchesQuery(query, query.trim())) {
    title = query.trim();
  }
  if (
    (isNonProductListing(title, hit.url, listingSnippet) &&
      !(isSoftGoodsQuery(query) && isSpecificIntlProductTitle(title, listingSnippet)) &&
      !saApparelWholesale) ||
    !isValidProductName(title)
  ) {
    return null;
  }

  const category = resolveProductCategory(query, title);
  const intel = buildSupplierIntel(query, allHits, index);
  const priceZar =
    hit.estimatedPriceZar ??
    (hit.estimatedPriceUsd ? zarFromUsd(hit.estimatedPriceUsd) : 0);
  if (!isPlausibleWholesalePrice(query, priceZar)) return null;

  const listingDescription = cleanListingField(hit.listingDescription, 420);
  const listingHighlights = sanitizeHighlightBullets(hit.listingHighlights ?? []).filter(
    (h) => !isPollutedListingCopy(h) && !containsSearchSnippetJunk(h),
  );

  const supplierLabel = hit.domain.replace(/^www\./, "");
  const productName = normalizeCustomerProductTitle(query, title, [supplierLabel]);
  if (!productNameMatchesQuery(query, productName)) return null;
  if ((isCatalogPageTitle(productName) || isJunkProductTitle(productName)) && !saApparelWholesale) {
    return null;
  }
  if (isSupplierBrandedCatalogTitle(productName, supplierLabel) && !saApparelWholesale) return null;

  const description = customerFacingListingCopy(
    [listingDescription, hit.listingSummary, hit.snippet],
    productName,
  );
  const summary =
    cleanListingField(hit.listingSummary, 140) ||
    (description.length > 140 ? `${productName} — ready to order.` : description);

  return applyAttributeValidation(
    {
      name: productName,
      slug: slugify(productName),
      description,
      summary: humanize(summary),
      category,
      basePrice: priceZar,
      supplierMoq: hit.supplierMoq,
      priceVatStatus: hit.priceVatStatus,
      supplierName: supplierLabel,
      supplierUrl: hit.url,
      deliveryDaysMin: deliveryDaysForSupplierRegion(hit.region).min,
      deliveryDaysMax: deliveryDaysForSupplierRegion(hit.region).max,
      rating: 0,
      reviewCount: 0,
      highlights: listingHighlights,
      specifications: {},
      colours: [],
      sizes: [],
      variants: { options: [], variants: [] },
      supplierIntel: intel ?? undefined,
      candidateImageUrl: hit.listingImageUrl,
    },
    query,
    hit,
  );
}
