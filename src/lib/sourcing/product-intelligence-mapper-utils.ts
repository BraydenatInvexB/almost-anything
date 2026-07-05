import {
  isPollutedListingCopy,
  sanitizeHighlightBullets,
  sanitizeListingCopy,
  containsSearchSnippetJunk,
  stripSearchSnippetNoise,
} from "@/lib/sourcing/listing-copy-sanitizer";
import { validateProductAttributes } from "@/lib/sourcing/product-attribute-validator";
import type { DiscoveredProductDraft } from "@/lib/sourcing/product-intelligence-types";
import { humanize as humanizeText, slugify as slugifyText } from "@/lib/sourcing/product-intelligence-types";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

export function cleanListingField(text: string | undefined, max = 500): string {
  if (!text?.trim()) return "";
  const stripped = stripSearchSnippetNoise(text.trim());
  if (!stripped || containsSearchSnippetJunk(stripped)) return "";
  const cleaned = sanitizeListingCopy(stripped, max);
  return isPollutedListingCopy(cleaned) ? "" : cleaned;
}

export function customerFacingListingCopy(
  sources: Array<string | undefined>,
  productName: string,
): string {
  for (const raw of sources) {
    const cleaned = cleanListingField(raw, 420);
    if (cleaned) return humanizeText(cleaned);
  }
  return `${productName} available to order.`;
}

export function applyAttributeValidation(
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
    slug: slugifyText(validated.name),
  };
}

export { sanitizeHighlightBullets };
