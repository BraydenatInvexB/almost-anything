import { resolveProductCategory } from "@/lib/catalog/category-resolver";
import { ensureVariantStock } from "@/lib/catalog/product-stock-label";
import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";
import {
  isPollutedListingCopy,
  sanitizeHighlightBullets,
  sanitizeListingCopy,
  containsSearchSnippetJunk,
  stripSearchSnippetNoise,
} from "@/lib/sourcing/listing-copy-sanitizer";
import { validateProductAttributes } from "@/lib/sourcing/product-attribute-validator";
import { deliveryDaysForSupplierRegion } from "@/config/delivery";
import {
  isAccessoryListing,
  isCatalogPageTitle,
  isSupplierBrandedCatalogTitle,
  isNonProductListing,
  isPlausibleWholesalePrice,
  normalizeCustomerProductTitle,
  productNameMatchesQuery,
  refineProductTitle,
  zarFromUsd,
} from "@/lib/sourcing/wholesale-listing-quality";
import {
  isSaCommonlyStockedProduct,
  isSaSupplierHit,
  isSaSupplierUrl,
} from "@/lib/sourcing/wholesale-sa-priority";
import { isRelevantProductHit, rankHitsByRelevance } from "@/lib/sourcing/query-relevance";
import {
  buildSupplierIntel,
  isJunkProductTitle,
  isRetailPriceSource,
  isValidProductName,
} from "@/lib/sourcing/wholesale-supplier-search";
import type { ProductSupplierIntel, WholesaleSearchHit } from "@/types/supplier-sourcing";
import type { ProductVariantsConfig } from "@/types/product-variants";
import { buildVariantMatrix } from "@/types/product-variants";

export type DiscoveredProductDraft = {
  name: string;
  slug: string;
  description: string;
  summary: string;
  category: string;
  basePrice: number;
  supplierName: string;
  supplierUrl: string;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  rating: number;
  reviewCount: number;
  highlights: string[];
  specifications: Record<string, string>;
  colours: string[];
  sizes: string[];
  variants: ProductVariantsConfig;
  candidateImageUrl?: string;
  supplierIntel?: ProductSupplierIntel;
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function humanize(text: string): string {
  return text
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s*--\s*/g, ", ")
    .replace(/\s+-\s+/g, ", ")
    .trim();
}

function wholesaleUsdFromHit(hit: WholesaleSearchHit): number {
  if (hit.estimatedPriceUsd) return hit.estimatedPriceUsd;
  if (hit.estimatedPriceZar) return hit.estimatedPriceZar / ZAR_PER_USD;
  return 0;
}

function cleanListingField(text: string | undefined, max = 500): string {
  if (!text?.trim()) return "";
  const stripped = stripSearchSnippetNoise(text.trim());
  if (!stripped || containsSearchSnippetJunk(stripped)) return "";
  const cleaned = sanitizeListingCopy(stripped, max);
  return isPollutedListingCopy(cleaned) ? "" : cleaned;
}

function customerFacingListingCopy(
  sources: Array<string | undefined>,
  productName: string,
): string {
  for (const raw of sources) {
    const cleaned = cleanListingField(raw, 420);
    if (cleaned) return humanize(cleaned);
  }
  return `${productName} available to order.`;
}

function applyAttributeValidation(
  draft: DiscoveredProductDraft,
  query: string,
  hit?: WholesaleSearchHit | null,
): DiscoveredProductDraft | null {
  const validated = validateProductAttributes({
    query,
    name: draft.name,
    description: draft.description,
    summary: draft.summary,
    specifications: draft.specifications,
    listingTitle: hit?.title,
    listingSnippet: hit?.snippet,
  });

  if (validated.rejected) return null;

  return {
    ...draft,
    name: validated.name,
    description: validated.description,
    summary: validated.summary,
    specifications: validated.specifications,
    slug: slugify(validated.name),
  };
}

export function mapHitToDraft(
  hit: WholesaleSearchHit,
  query: string,
  index: number,
  allHits: WholesaleSearchHit[],
): DiscoveredProductDraft | null {
  const rawTitle = hit.title.slice(0, 120) || query;
  const listingSnippet = hit.listingSummary ?? hit.listingDescription ?? hit.snippet;
  if (isAccessoryListing(query, rawTitle, listingSnippet)) return null;
  if (isNonProductListing(rawTitle, hit.url, listingSnippet)) return null;
  if (isCatalogPageTitle(rawTitle)) return null;
  if (isSupplierBrandedCatalogTitle(rawTitle, hit.domain)) return null;
  if (!isValidProductName(rawTitle)) return null;
  if (isRetailPriceSource(hit.domain) || hit.tier === "retail") return null;
  if (!isRelevantProductHit(query, rawTitle, hit.snippet, hit.url)) return null;

  let title = refineProductTitle(query, rawTitle, listingSnippet);
  if (isJunkProductTitle(title) && productNameMatchesQuery(query, query.trim())) {
    title = query.trim();
  }
  if (isNonProductListing(title, hit.url, listingSnippet) || !isValidProductName(title)) return null;

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
  if (isCatalogPageTitle(productName) || isJunkProductTitle(productName)) return null;
  if (isSupplierBrandedCatalogTitle(productName, supplierLabel)) return null;

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
      supplierName: supplierLabel,
      supplierUrl: hit.url,
      deliveryDaysMin: deliveryDaysForSupplierRegion(hit.region).min,
      deliveryDaysMax: deliveryDaysForSupplierRegion(hit.region).max,
      rating: 4.5,
      reviewCount: 12,
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
      supplierName,
      supplierUrl,
      deliveryDaysMin:
        Number(raw.delivery_days_min) ||
        deliveryDaysForSupplierRegion(matchedHit?.region).min,
      deliveryDaysMax:
        Number(raw.delivery_days_max) ||
        deliveryDaysForSupplierRegion(matchedHit?.region).max,
      rating: Number(raw.rating) || 4.5,
      reviewCount: Number(raw.review_count) || 12,
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

export function sortByWholesalePrice(drafts: DiscoveredProductDraft[]): DiscoveredProductDraft[] {
  return [...drafts].sort((a, b) => a.basePrice - b.basePrice);
}

export function sortByRelevanceThenPrice(hits: WholesaleSearchHit[]): WholesaleSearchHit[] {
  return [...hits].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.estimatedPriceZar ?? Number.MAX_SAFE_INTEGER) - (b.estimatedPriceZar ?? Number.MAX_SAFE_INTEGER);
  });
}

export function pickRelevantHits(query: string, hits: WholesaleSearchHit[]): WholesaleSearchHit[] {
  const ranked = rankHitsByRelevance(hits, query);
  return ranked.filter((hit) => isRelevantProductHit(query, hit.title, hit.snippet, hit.url));
}

export function draftsFromHits(
  hits: WholesaleSearchHit[],
  query: string,
  allHits: WholesaleSearchHit[],
  maxProducts: number,
): DiscoveredProductDraft[] {
  return pickRelevantHits(query, hits)
    .slice(0, maxProducts + 2)
    .map((hit, i) => mapHitToDraft(hit, query, i, allHits))
    .filter((p): p is DiscoveredProductDraft => p !== null);
}

export function filterPublishableDrafts(
  drafts: DiscoveredProductDraft[],
  query: string,
): DiscoveredProductDraft[] {
  return drafts.filter(
    (d) =>
      isPlausibleWholesalePrice(query, d.basePrice) &&
      productNameMatchesQuery(query, d.name) &&
      !isJunkProductTitle(d.name),
  );
}
