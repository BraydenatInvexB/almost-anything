import "server-only";

import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";
import { llmCompleteJson, llmConfigured } from "@/lib/sourcing/llm-client";
import {
  extractStructuredData,
  validateImageUrl,
} from "@/lib/sourcing/advanced/structured-data-extractor";
import {
  matchesRequiredAttributes,
  type ParsedQuery,
} from "@/lib/sourcing/advanced/query-parser";
import type {
  AdvancedExtractedPage,
  AdvancedSourceRegion,
  AdvancedSupplierType,
} from "@/lib/sourcing/advanced/types";
import type { SupplierRegion, SupplierTier, WholesaleSearchHit } from "@/types/supplier-sourcing";

const AI_FALLBACK_SYSTEM = `Extract structured NEW product data from webpage HTML for a South African store.
Never accept used, refurbished, or pre-owned items.

Output JSON only:
{ "title": string, "price": number|null, "currencyDetected": string|null, "imageUrl": string|null,
  "description": string, "colours": string[], "variants": string[], "inStock": boolean,
  "confidence": number, "condition": "new"|"used"|"refurbished"|"unknown" }`;

const FX_TO_ZAR: Record<string, number> = { ZAR: 1, USD: ZAR_PER_USD, GBP: 23.5, EUR: 20 };

async function fetchPageHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AlmostAnythingSourcingBot/1.0)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Failed to fetch page: ${res.status}`);
  return res.text();
}

async function aiTextFallback(
  pageText: string,
  url: string,
  originalQuery: string,
): Promise<Omit<AdvancedExtractedPage, "extractionMethod"> | null> {
  if (!llmConfigured()) return null;

  try {
    const parsed = await llmCompleteJson(
      AI_FALLBACK_SYSTEM,
      `ORIGINAL SEARCH QUERY: "${originalQuery}"\n\nPAGE URL: ${url}\n\nPAGE CONTENT:\n${pageText.slice(0, 25000)}`,
      "anthropic",
    );
    return {
      title: typeof parsed.title === "string" ? parsed.title : originalQuery,
      price: typeof parsed.price === "number" ? parsed.price : null,
      currencyDetected:
        typeof parsed.currencyDetected === "string" ? parsed.currencyDetected : null,
      imageUrl: typeof parsed.imageUrl === "string" ? parsed.imageUrl : null,
      description: typeof parsed.description === "string" ? parsed.description : "",
      colours: Array.isArray(parsed.colours)
        ? parsed.colours.filter((c): c is string => typeof c === "string")
        : [],
      variants: Array.isArray(parsed.variants)
        ? parsed.variants.filter((v): v is string => typeof v === "string")
        : [],
      inStock: parsed.inStock !== false,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      condition:
        parsed.condition === "used" || parsed.condition === "refurbished"
          ? parsed.condition
          : parsed.condition === "new"
            ? "new"
            : "unknown",
    };
  } catch {
    return null;
  }
}

export async function extractProductFromPage(
  url: string,
  originalQuery: string,
  parsedQuery?: ParsedQuery,
): Promise<AdvancedExtractedPage | null> {
  let html: string;
  try {
    html = await fetchPageHtml(url);
  } catch {
    return null;
  }

  const structured = extractStructuredData(html);
  if (structured.price !== null && structured.imageUrl !== null) {
    const imageValid = await validateImageUrl(structured.imageUrl);
    if (imageValid) {
      const title = structured.title ?? originalQuery;
      const description = structured.description ?? "";

      if (parsedQuery) {
        const check = matchesRequiredAttributes(title, description, parsedQuery);
        if (!check.matches) return null;
      }

      const conditionHint = /\b(used|pre-?owned|refurbished|renewed|open box|grade [a-c])\b/i.test(
        `${title} ${description}`,
      )
        ? "used"
        : "new";

      return {
        title,
        price: structured.price,
        currencyDetected: structured.currency,
        imageUrl: structured.imageUrl,
        description,
        colours: [],
        variants: [],
        inStock: structured.availability !== "out_of_stock",
        confidence: 0.9,
        condition: conditionHint,
        extractionMethod: "structured-data",
      };
    }
  }

  const aiResult = await aiTextFallback(html, url, originalQuery);
  if (!aiResult || aiResult.price === null || aiResult.imageUrl === null) return null;

  const imageValid = await validateImageUrl(aiResult.imageUrl);
  if (!imageValid) return null;

  if (parsedQuery) {
    const check = matchesRequiredAttributes(aiResult.title, aiResult.description, parsedQuery);
    if (!check.matches) return null;
  }

  return { ...aiResult, extractionMethod: "ai-text-fallback" };
}

function mapAdvancedTypeToTier(supplierType: AdvancedSupplierType): SupplierTier {
  switch (supplierType) {
    case "manufacturer":
      return "manufacturer";
    case "wholesaler":
      return "wholesale";
    case "distributor":
      return "distributor";
    case "marketplace":
      return "trade";
    default:
      return "retail";
  }
}

function tierScore(tier: SupplierTier, confidence: number): number {
  const base: Record<SupplierTier, number> = {
    manufacturer: 320,
    wholesale: 280,
    distributor: 200,
    trade: 120,
    retail: 20,
  };
  return (base[tier] ?? 50) + Math.round(confidence * 60);
}

export function toWholesaleSearchHit(
  url: string,
  extracted: AdvancedExtractedPage,
  supplierType: AdvancedSupplierType,
  region: AdvancedSourceRegion,
  domain: string,
): WholesaleSearchHit | null {
  if (extracted.price === null || extracted.imageUrl === null) return null;
  if (extracted.condition === "used" || extracted.condition === "refurbished") return null;
  if ((extracted.confidence ?? 0) < 0.55) return null;

  const rate = FX_TO_ZAR[extracted.currencyDetected ?? "ZAR"] ?? 1;
  const priceZar = Math.round(extracted.price * rate * 100) / 100;
  const supplierRegion: SupplierRegion = region === "ZA" ? "south_africa" : "international";
  const tier = mapAdvancedTypeToTier(supplierType);

  return {
    title: extracted.title,
    url,
    snippet: extracted.description.slice(0, 280) || `${extracted.title} — verified listing`,
    domain,
    region: supplierRegion,
    tier,
    estimatedPriceZar: priceZar,
    listingImageUrl: extracted.imageUrl,
    listingDescription: extracted.description,
    listingSummary: extracted.description.slice(0, 140),
    listingHighlights: extracted.variants.length ? extracted.variants : undefined,
    score: tierScore(tier, extracted.confidence ?? 0.7),
  };
}
