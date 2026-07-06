import type { ProductVariantsConfig } from "@/types/product-variants";
import { parseVariantsConfig } from "@/types/product-variants";
import type { ProductSupplierIntel, SupplierListing } from "@/types/supplier-sourcing";
import { parseManualSuppliers } from "@/lib/product/product-manual-suppliers";
import {
  isPollutedListingCopy,
  sanitizeHighlightBullets,
  containsSearchSnippetJunk,
  stripSearchSnippetNoise,
} from "@/lib/sourcing/listing-copy-sanitizer";

export interface ProductEnrichment {
  highlights: string[];
  specifications: Record<string, string>;
  summary?: string;
  variants?: ProductVariantsConfig;
  sourcing?: {
    query: string;
    discoveredAt: string;
    supplierName?: string;
  };
  supplierIntel?: ProductSupplierIntel;
  manualSuppliers?: SupplierListing[];
  minimumOrderQuantity?: number;
  unitLabel?: string;
  pricingNote?: string;
  isMicroItem?: boolean;
}

export function emptyEnrichment(): ProductEnrichment {
  return { highlights: [], specifications: {} };
}

/** Spec keys and highlight phrases that must never appear on the storefront. */
const INTERNAL_SPEC_KEY = /^(source|region|reference price|supplier|supplier url|wholesale|wholesale price|cost price|base price|tier|fob|moq)$/i;

const INTERNAL_HIGHLIGHT_LINE =
  /^(south african trade supplier|international wholesale source|competitive cost base|trade tier pricing|.+ tier pricing)$/i;

export function isBoilerplateDescription(text: string): boolean {
  const t = text.trim();
  if (t.length < 20) return true;
  if (/^Trade-priced .+ with competitive storefront pricing\.?$/i.test(t)) return true;
  if (/^.+ sourced at trade pricing from a South African supplier\.?$/i.test(t)) return true;
  if (/^.+ sourced from a South African supplier listing with fast local fulfilment\.?$/i.test(t)) return true;
  if (/at competitive trade pricing/i.test(t)) return true;
  if (/wholesale sourced, ready to order/i.test(t)) return true;
  return false;
}

function isInternalHighlightLine(item: string): boolean {
  const t = item.trim();
  if (t.length < 5) return true;
  if (INTERNAL_HIGHLIGHT_LINE.test(t)) return true;
  if (t.length < 90 && /trade supplier|wholesale source|tier pricing|cost base/i.test(t)) return true;
  return false;
}

export function customerFacingDescription(text: string | undefined | null): string {
  if (!text?.trim()) return "";
  const trimmed = stripSearchSnippetNoise(text.trim());
  if (!trimmed || containsSearchSnippetJunk(trimmed)) return "";
  if (isBoilerplateDescription(trimmed) || isPollutedListingCopy(trimmed)) return "";
  return trimmed.length > 500 ? `${trimmed.slice(0, 500).trim()}…` : trimmed;
}

export function customerFacingSpecifications(
  specifications: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(specifications).filter(([key, value]) => {
      if (INTERNAL_SPEC_KEY.test(key.trim())) return false;
      if (/^R\s?\d/i.test(value) && /price|cost|wholesale|reference/i.test(key)) return false;
      return true;
    }),
  );
}

export function customerFacingHighlights(highlights: string[]): string[] {
  return sanitizeHighlightBullets(
    expandHighlightBullets(highlights.filter((item) => !isInternalHighlightLine(item))),
  ).filter((item) => !isPollutedListingCopy(item) && !containsSearchSnippetJunk(item));
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const sentenceEnd = trimmed.match(/^[\s\S]+?(?:\.\s+(?=[A-Z])|[!?](?:\s|$))/);
  if (sentenceEnd) {
    return sentenceEnd[0].trim();
  }

  if (trimmed.length <= 220) return trimmed;

  const cut = trimmed.slice(0, 220);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** Build shopper-facing about text + feature bullets from stored product copy. */
export function buildCustomerProductCopy(
  description: string | null | undefined,
  enrichment: ProductEnrichment,
): { about: string; highlights: string[] } {
  const rawDesc = description?.trim() ?? "";
  const rawSummary = enrichment.summary?.trim() ?? "";

  let highlights = customerFacingHighlights(enrichment.highlights);

  if (!highlights.length && rawDesc && !isBoilerplateDescription(rawDesc)) {
    highlights = expandHighlightBullets([rawDesc]);
  }

  const descOk =
    rawDesc &&
    !isBoilerplateDescription(rawDesc) &&
    !isPollutedListingCopy(rawDesc) &&
    !containsSearchSnippetJunk(rawDesc)
      ? rawDesc
      : "";
  const summaryOk =
    rawSummary &&
    !isBoilerplateDescription(rawSummary) &&
    !isPollutedListingCopy(rawSummary) &&
    !containsSearchSnippetJunk(rawSummary)
      ? rawSummary
      : "";

  let about = "";
  if (summaryOk && summaryOk.length <= 240) {
    about = summaryOk;
  } else if (highlights.length > 1) {
    about = firstSentence(highlights[0]);
  } else if (descOk) {
    about = descOk.length > 340 ? `${descOk.slice(0, 340).trim()}…` : descOk;
  } else if (highlights.length > 0) {
    about = firstSentence(highlights[0]);
  }

  if (!about && highlights.length > 0) {
    about = firstSentence(highlights[0]);
  }

  if (about && highlights.length === 1 && about === highlights[0]) {
    about = firstSentence(about);
  }

  return { about, highlights };
}

/** Split a single concatenated listing paragraph into separate feature bullets. */
export function expandHighlightBullets(highlights: string[]): string[] {
  const expanded: string[] = [];

  for (const item of highlights) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    if (trimmed.length < 100) {
      expanded.push(trimmed);
      continue;
    }

    const parts = trimmed
      .split(
        /\s+(?=(?:Large \d|Dual[- ]|Match[- ]|Easy,|Express |Convenient |Adjustable |Temperature &|Auto shut|Save on |Built,|Bonus!|One[- ]touch|Non[- ]stick|Removable |Includes |Perfect for ))/,
      )
      .map((part) => part.trim())
      .filter((part) => part.length > 12);

    if (parts.length > 1) expanded.push(...parts);
    else {
      const sentences = trimmed
        .split(/\.\s+(?=[A-Z])|(?:\s+–\s+)/)
        .map((part) => part.trim())
        .filter((part) => part.length > 20);
      if (sentences.length > 1) {
        expanded.push(...sentences.map((s) => (s.endsWith(".") ? s : `${s}.`)));
      } else {
        expanded.push(trimmed);
      }
    }
  }

  return expanded.filter((value, index, array) => array.indexOf(value) === index);
}

/** Strip procurement/sourcing fields before rendering product pages for shoppers. */
export function customerFacingEnrichment(enrichment: ProductEnrichment): ProductEnrichment {
  return {
    ...enrichment,
    summary: customerFacingDescription(enrichment.summary) || undefined,
    highlights: customerFacingHighlights(enrichment.highlights),
    specifications: customerFacingSpecifications(enrichment.specifications),
    supplierIntel: undefined,
    sourcing: undefined,
    manualSuppliers: undefined,
  };
}

export function parseProductEnrichment(metadata: unknown): ProductEnrichment {
  const base = emptyEnrichment();
  if (!metadata || typeof metadata !== "object") return base;

  const raw = metadata as Record<string, unknown>;
  const highlights = Array.isArray(raw.highlights)
    ? raw.highlights.filter((h): h is string => typeof h === "string")
    : [];

  const specifications: Record<string, string> = {};
  if (raw.specifications && typeof raw.specifications === "object") {
    for (const [k, v] of Object.entries(raw.specifications as Record<string, unknown>)) {
      if (typeof v === "string") specifications[k] = v;
    }
  }

  const variants = parseVariantsConfig(metadata) ?? undefined;
  const sourcing =
    raw.sourcing && typeof raw.sourcing === "object"
      ? (raw.sourcing as ProductEnrichment["sourcing"])
      : undefined;

  const supplierIntel =
    raw.supplierIntel && typeof raw.supplierIntel === "object"
      ? (raw.supplierIntel as ProductSupplierIntel)
      : undefined;

  const manualSuppliers = parseManualSuppliers(metadata);

  return {
    highlights,
    specifications,
    summary: typeof raw.summary === "string" ? raw.summary : undefined,
    variants,
    sourcing,
    supplierIntel,
    manualSuppliers: manualSuppliers.length ? manualSuppliers : undefined,
    minimumOrderQuantity:
      typeof raw.minimumOrderQuantity === "number" ? raw.minimumOrderQuantity : undefined,
    unitLabel: typeof raw.unitLabel === "string" ? raw.unitLabel : undefined,
    pricingNote: typeof raw.pricingNote === "string" ? raw.pricingNote : undefined,
    isMicroItem: raw.isMicroItem === true,
  };
}

export function buildProductMetadata(input: {
  variants?: ProductVariantsConfig | null;
  highlights?: string[];
  specifications?: Record<string, string>;
  summary?: string;
  sourcing?: ProductEnrichment["sourcing"];
  supplierIntel?: ProductSupplierIntel;
  manualSuppliers?: SupplierListing[];
  minimumOrderQuantity?: number;
  unitLabel?: string;
  pricingNote?: string;
  isMicroItem?: boolean;
}): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};
  if (input.highlights?.length) metadata.highlights = input.highlights;
  if (input.specifications && Object.keys(input.specifications).length) {
    metadata.specifications = input.specifications;
  }
  if (input.summary) metadata.summary = input.summary;
  if (input.variants?.options.length) metadata.variants = input.variants;
  if (input.sourcing) metadata.sourcing = input.sourcing;
  if (input.supplierIntel) metadata.supplierIntel = input.supplierIntel;
  if (input.manualSuppliers?.length) metadata.manualSuppliers = input.manualSuppliers;
  if (input.minimumOrderQuantity && input.minimumOrderQuantity > 1) {
    metadata.minimumOrderQuantity = input.minimumOrderQuantity;
  }
  if (input.unitLabel) metadata.unitLabel = input.unitLabel;
  if (input.pricingNote) metadata.pricingNote = input.pricingNote;
  if (input.isMicroItem) metadata.isMicroItem = true;
  return metadata;
}
