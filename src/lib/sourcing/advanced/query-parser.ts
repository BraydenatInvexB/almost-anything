import "server-only";

import { llmCompleteJson, llmConfigured } from "@/lib/sourcing/llm-client";

export interface ParsedQuery {
  canonicalProduct: string;
  brand: string | null;
  model: string | null;
  generationOrYear: string | null;
  requiredAttributes: Record<string, string>;
  searchVariants: string[];
}

const QUERY_PARSE_SYSTEM = `You parse a customer product search query into structured attributes for an ecommerce sourcing system.
Distinguish attributes that change what product this is (model, generation, year, storage) from preferences (color unless required).

Output JSON only:
{
  "canonicalProduct": string,
  "brand": string|null,
  "model": string|null,
  "generationOrYear": string|null,
  "requiredAttributes": { [key: string]: string },
  "searchVariants": string[]
}`;

function fallbackParse(rawQuery: string): ParsedQuery {
  return {
    canonicalProduct: rawQuery.trim(),
    brand: null,
    model: null,
    generationOrYear: null,
    requiredAttributes: {},
    searchVariants: [rawQuery.trim()],
  };
}

export async function parseQuery(rawQuery: string): Promise<ParsedQuery> {
  const trimmed = rawQuery.trim();
  if (!trimmed) return fallbackParse(trimmed);
  if (!llmConfigured()) return fallbackParse(trimmed);

  try {
    const parsed = await llmCompleteJson(QUERY_PARSE_SYSTEM, trimmed, "anthropic");
    const canonical =
      typeof parsed.canonicalProduct === "string" && parsed.canonicalProduct.trim()
        ? parsed.canonicalProduct.trim()
        : trimmed;
    const variants = Array.isArray(parsed.searchVariants)
      ? parsed.searchVariants.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      : [];
    return {
      canonicalProduct: canonical,
      brand: typeof parsed.brand === "string" ? parsed.brand : null,
      model: typeof parsed.model === "string" ? parsed.model : null,
      generationOrYear:
        typeof parsed.generationOrYear === "string" ? parsed.generationOrYear : null,
      requiredAttributes:
        parsed.requiredAttributes && typeof parsed.requiredAttributes === "object"
          ? Object.fromEntries(
              Object.entries(parsed.requiredAttributes as Record<string, unknown>).filter(
                (entry): entry is [string, string] => typeof entry[1] === "string",
              ),
            )
          : {},
      searchVariants: variants.length ? variants : [canonical, trimmed],
    };
  } catch {
    return fallbackParse(trimmed);
  }
}

/** Only enforce attributes that uniquely identify a SKU (storage, year, model numbers). */
function isHardAttribute(_key: string, value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!v || v.length < 2) return false;
  if (/\d/.test(v)) return true;
  if (/\b(gb|tb|mb|mah|mm|cm|inch|")\b/i.test(v)) return true;
  return false;
}

/** Hard attribute gate — rejects wrong generation/storage/model matches. */
export function matchesRequiredAttributes(
  extractedTitle: string,
  extractedDescription: string,
  parsed: ParsedQuery,
): { matches: boolean; failedAttribute?: string } {
  const haystack = `${extractedTitle} ${extractedDescription}`.toLowerCase();

  if (parsed.generationOrYear && /\d/.test(parsed.generationOrYear)) {
    if (!haystack.includes(parsed.generationOrYear.toLowerCase())) {
      return { matches: false, failedAttribute: "generationOrYear" };
    }
  }

  for (const [key, value] of Object.entries(parsed.requiredAttributes)) {
    if (!isHardAttribute(key, value)) continue;
    if (!haystack.includes(value.toLowerCase())) {
      return { matches: false, failedAttribute: key };
    }
  }

  return { matches: true };
}
