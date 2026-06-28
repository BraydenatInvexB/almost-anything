import type { QuoteRequestPayload, QuoteResponse } from "@/types";
import { calculateMarkup } from "@/lib/markup/engine";
import {
  QUOTE_TIER_DESCRIPTIONS,
  QUOTE_TIER_LABELS,
  SITE_CONFIG,
} from "@/config/site";
import type { QuoteTier } from "@/types/database";

interface ParsedIntent {
  productType: string;
  keywords: string[];
  attributes: string[];
  budgetRange: { min: number; max: number } | null;
}

interface SupplierCandidate {
  productName: string;
  supplierName: string;
  supplierUrl: string;
  basePrice: number;
  deliveryDays: number;
  qualityScore: number;
  rating: number;
  imageUrl: string;
  category: string;
}

const SUPPLIER_POOL: SupplierCandidate[] = [
  {
    productName: "Curved Modular Long Chair",
    supplierName: "Nordic Home Direct",
    supplierUrl: "https://example.com/nordic-long-chair",
    basePrice: 430,
    deliveryDays: 7,
    qualityScore: 92,
    rating: 4.9,
    imageUrl:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=1000&fit=crop",
    category: "sofa",
  },
  {
    productName: "Minimal Oak Frame Armchair",
    supplierName: "Artisan Loft Co.",
    supplierUrl: "https://example.com/artisan-armchair",
    basePrice: 289,
    deliveryDays: 5,
    qualityScore: 88,
    rating: 4.7,
    imageUrl:
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&h=600&fit=crop",
    category: "chair",
  },
  {
    productName: "PureSpace Focus Duo Set",
    supplierName: "Studio Essentials",
    supplierUrl: "https://example.com/purespace-duo",
    basePrice: 620,
    deliveryDays: 10,
    qualityScore: 96,
    rating: 4.9,
    imageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    category: "chair",
  },
  {
    productName: "Scandinavian Dining Table",
    supplierName: "FlatPack Pro",
    supplierUrl: "https://example.com/scandi-table",
    basePrice: 340,
    deliveryDays: 4,
    qualityScore: 85,
    rating: 4.5,
    imageUrl:
      "https://images.unsplash.com/photo-1617806118773-12e9322a79cf?w=800&h=600&fit=crop",
    category: "table",
  },
  {
    productName: "Cloud Comfort Bed Frame",
    supplierName: "SleepWell Supply",
    supplierUrl: "https://example.com/cloud-bed",
    basePrice: 510,
    deliveryDays: 8,
    qualityScore: 90,
    rating: 4.8,
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop",
    category: "bed",
  },
  {
    productName: "Arc Floor Lamp, Matte Black",
    supplierName: "Lumen Wholesale",
    supplierUrl: "https://example.com/arc-lamp",
    basePrice: 145,
    deliveryDays: 3,
    qualityScore: 82,
    rating: 4.6,
    imageUrl:
      "https://images.unsplash.com/photo-1507473889455-b7bdd792147e?w=800&h=600&fit=crop",
    category: "lamps",
  },
];

export function parseCustomerIntent(
  payload: QuoteRequestPayload,
): ParsedIntent {
  const query = payload.query.toLowerCase();
  const keywords = query
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 8);

  const categoryHints: Record<string, string[]> = {
    sofa: ["sofa", "couch", "sectional", "loveseat"],
    chair: ["chair", "armchair", "seat", "stool"],
    table: ["table", "desk", "dining"],
    bed: ["bed", "mattress", "frame"],
    lamps: ["lamp", "light", "lighting"],
    dressers: ["dresser", "drawer", "cabinet"],
  };

  let productType = "general product";
  for (const [category, hints] of Object.entries(categoryHints)) {
    if (hints.some((hint) => query.includes(hint))) {
      productType = category;
      break;
    }
  }

  const attributes: string[] = [];
  if (query.includes("cheap") || query.includes("budget")) attributes.push("budget-conscious");
  if (query.includes("fast") || query.includes("urgent")) attributes.push("fast-delivery");
  if (query.includes("quality") || query.includes("premium")) attributes.push("high-quality");
  if (query.includes("minimal") || query.includes("modern")) attributes.push("minimalist");

  const budgetRange = payload.budget
    ? { min: payload.budget * 0.7, max: payload.budget * 1.2 }
    : null;

  return {
    productType: payload.category ?? productType,
    keywords,
    attributes,
    budgetRange,
  };
}

function scoreCandidate(
  candidate: SupplierCandidate,
  intent: ParsedIntent,
  tier: QuoteTier,
): number {
  let score = 0;

  if (candidate.category === intent.productType) score += 30;

  const keywordMatches = intent.keywords.filter((kw) =>
    candidate.productName.toLowerCase().includes(kw),
  ).length;
  score += keywordMatches * 10;

  switch (tier) {
    case "cheapest":
      score += Math.max(0, 100 - candidate.basePrice / 10);
      break;
    case "fastest":
      score += Math.max(0, 50 - candidate.deliveryDays * 4);
      break;
    case "best_quality":
      score += candidate.qualityScore;
      score += candidate.rating * 5;
      break;
  }

  if (intent.budgetRange) {
    const markup = calculateMarkup({
      basePrice: candidate.basePrice,
      category: candidate.category,
    });
    if (
      markup.retailPrice >= intent.budgetRange.min &&
      markup.retailPrice <= intent.budgetRange.max
    ) {
      score += 20;
    }
  }

  return score;
}

function pickBestForTier(
  candidates: SupplierCandidate[],
  intent: ParsedIntent,
  tier: QuoteTier,
): SupplierCandidate {
  const sorted = [...candidates].sort(
    (a, b) => scoreCandidate(b, intent, tier) - scoreCandidate(a, intent, tier),
  );
  return sorted[0] ?? candidates[0];
}

export function generateQuoteOptions(
  payload: QuoteRequestPayload,
  requestId: string,
): QuoteResponse {
  const intent = parseCustomerIntent(payload);
  const tiers: QuoteTier[] = ["cheapest", "fastest", "best_quality"];

  const filteredCandidates = SUPPLIER_POOL.filter((candidate) => {
    if (intent.productType === "general product") return true;
    return (
      candidate.category === intent.productType ||
      intent.keywords.some((kw) =>
        candidate.productName.toLowerCase().includes(kw),
      )
    );
  });

  const pool =
    filteredCandidates.length > 0 ? filteredCandidates : SUPPLIER_POOL;

  const options = tiers.map((tier) => {
    const candidate = pickBestForTier(pool, intent, tier);
    const markup = calculateMarkup({
      basePrice: candidate.basePrice,
      category: candidate.category,
      supplierRating: candidate.rating,
      urgency: payload.urgency ?? "standard",
    });

    return {
      id: `${requestId}_${tier}`,
      tier,
      tierLabel: QUOTE_TIER_LABELS[tier],
      productName: candidate.productName,
      supplierName: candidate.supplierName,
      basePrice: markup.basePrice,
      retailPrice: markup.retailPrice,
      deliveryDays: candidate.deliveryDays,
      qualityScore: candidate.qualityScore,
      rating: candidate.rating,
      imageUrl: candidate.imageUrl,
      savings:
        tier === "cheapest"
          ? Math.round(markup.retailPrice * 0.12)
          : undefined,
    };
  });

  return {
    requestId,
    query: payload.query,
    parsedIntent: intent,
    options,
    generatedAt: new Date().toISOString(),
  };
}

export function getTierDescription(tier: QuoteTier): string {
  return QUOTE_TIER_DESCRIPTIONS[tier];
}

export { SUPPLIER_POOL };
