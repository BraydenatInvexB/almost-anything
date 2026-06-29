import { resolveProductCategory } from "@/lib/catalog/category-resolver";
import { ensureVariantStock } from "@/lib/catalog/product-stock-label";
import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";
import {
  isPollutedListingCopy,
  sanitizeHighlightBullets,
  sanitizeListingCopy,
} from "@/lib/sourcing/listing-copy-sanitizer";
import { validateProductAttributes } from "@/lib/sourcing/product-attribute-validator";
import { buildSupplierIntel, isValidProductName } from "@/lib/sourcing/wholesale-supplier-search";
import { isRelevantProductHit, rankHitsByRelevance } from "@/lib/sourcing/query-relevance";
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
  const cleaned = sanitizeListingCopy(text.trim(), max);
  return isPollutedListingCopy(cleaned) ? "" : cleaned;
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
  const title = hit.title.slice(0, 100) || query;
  if (!isValidProductName(title)) return null;
  if (!isRelevantProductHit(query, title, hit.snippet, hit.url)) return null;

  const category = resolveProductCategory(query, hit.title);
  const intel = buildSupplierIntel(query, allHits, index);
  const minPrice = hit.region === "south_africa" ? 15 : 49;
  if (!hit.estimatedPriceZar || hit.estimatedPriceZar < minPrice) return null;

  const listingDescription = cleanListingField(hit.listingDescription, 420);
  const listingHighlights = sanitizeHighlightBullets(hit.listingHighlights ?? []).filter(
    (h) => !isPollutedListingCopy(h),
  );

  return applyAttributeValidation(
    {
      name: humanize(title),
      slug: slugify(title),
      description: humanize(
        listingDescription ||
          `${title} sourced at trade pricing${hit.region === "south_africa" ? " from a South African supplier" : " from an international wholesaler"}.`,
      ),
      summary: humanize(
        cleanListingField(hit.listingSummary, 140) ||
          listingDescription.slice(0, 140) ||
          `${title} at competitive trade pricing.`,
      ),
      category,
      basePrice: hit.estimatedPriceZar,
      supplierName: hit.domain.replace(/^www\./, ""),
      supplierUrl: hit.url,
      deliveryDaysMin: hit.region === "south_africa" ? 3 : 7,
      deliveryDaysMax: hit.region === "south_africa" ? 7 : 21,
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
  const name = typeof raw.name === "string" ? humanize(raw.name) : null;
  if (!name) return null;

  const hitIndex = Number(raw.supplier_hit_index);
  const matchedHit = Number.isFinite(hitIndex) && hits[hitIndex] ? hits[hitIndex] : null;

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
  );

  const specifications: Record<string, string> = {};
  if (raw.specifications && typeof raw.specifications === "object") {
    for (const [k, v] of Object.entries(raw.specifications as Record<string, unknown>)) {
      if (typeof v === "string") specifications[k] = humanize(v);
    }
  }

  const supplierUrl =
    typeof raw.supplier_url === "string" && raw.supplier_url.startsWith("http")
      ? raw.supplier_url
      : matchedHit?.url ?? hits.find((h) => h.region === "south_africa")?.url ?? hits[0]?.url ?? "";

  if (!supplierUrl) return null;

  const supplierName =
    typeof raw.supplier_name === "string"
      ? raw.supplier_name
      : matchedHit?.domain.replace(/^www\./, "") ?? hits[0]?.domain.replace(/^www\./, "") ?? "Trade supplier";

  if (!isValidProductName(name)) return null;

  const hitIdx = matchedHit ? hits.indexOf(matchedHit) : 0;
  const intel = buildSupplierIntel(query, hits, hitIdx >= 0 ? hitIdx : 0);

  const rawDescription =
    typeof raw.description === "string" ? cleanListingField(raw.description, 420) : "";

  return applyAttributeValidation(
    {
      name,
      slug: typeof raw.slug === "string" ? raw.slug : slugify(name),
      description: humanize(rawDescription || `Trade-priced ${name} with fast fulfilment.`),
      summary: humanize(
        typeof raw.summary === "string" ? cleanListingField(raw.summary, 140) : `Shop ${name} at fair prices.`,
      ),
      category: resolveProductCategory(
        query,
        name,
        typeof raw.category === "string" ? raw.category : undefined,
      ),
      basePrice:
        Number(raw.base_price) ||
        wholesaleUsdFromHit(matchedHit ?? hits[0] ?? ({} as WholesaleSearchHit)) ||
        0,
      supplierName,
      supplierUrl,
      deliveryDaysMin: Number(raw.delivery_days_min) || (matchedHit?.region === "south_africa" ? 3 : 7),
      deliveryDaysMax: Number(raw.delivery_days_max) || (matchedHit?.region === "south_africa" ? 10 : 21),
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
