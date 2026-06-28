import { SITE_CONFIG } from "@/config/site";

export interface MarkupInput {
  basePrice: number;
  category?: string;
  supplierRating?: number;
  demandScore?: number;
  isExclusive?: boolean;
  urgency?: "standard" | "express" | "flexible";
}

export interface MarkupResult {
  basePrice: number;
  markupPercent: number;
  markupAmount: number;
  retailPrice: number;
  profit: number;
  currency: string;
}

const CATEGORY_MARKUP_ADJUSTMENTS: Record<string, number> = {
  electronics: 12,
  sofa: 15,
  chair: 14,
  bed: 16,
  table: 13,
  dressers: 14,
  lamps: 18,
  general: SITE_CONFIG.defaultMarkupPercent,
};

const URGENCY_MULTIPLIERS: Record<string, number> = {
  standard: 1,
  express: 1.08,
  flexible: 0.95,
};

export function calculateMarkup(input: MarkupInput): MarkupResult {
  const {
    basePrice,
    category = "general",
    supplierRating = 4,
    demandScore = 0.5,
    isExclusive = false,
    urgency = "standard",
  } = input;

  let markupPercent =
    CATEGORY_MARKUP_ADJUSTMENTS[category] ?? SITE_CONFIG.defaultMarkupPercent;

  if (supplierRating >= 4.8) markupPercent += 2;
  else if (supplierRating < 3.5) markupPercent -= 1;

  if (demandScore > 0.75) markupPercent += 3;
  else if (demandScore < 0.25) markupPercent -= 2;

  if (isExclusive) markupPercent += 5;

  markupPercent *= URGENCY_MULTIPLIERS[urgency] ?? 1;
  markupPercent = Math.min(
    SITE_CONFIG.maxMarkupPercent,
    Math.max(SITE_CONFIG.minMarkupPercent, markupPercent),
  );

  const markupAmount = roundCurrency(basePrice * (markupPercent / 100));
  const retailPrice = roundCurrency(basePrice + markupAmount);

  return {
    basePrice,
    markupPercent: roundPercent(markupPercent),
    markupAmount,
    retailPrice,
    profit: markupAmount,
    currency: SITE_CONFIG.defaultCurrency,
  };
}

export function applyBulkMarkup(
  items: MarkupInput[],
): MarkupResult[] {
  return items.map(calculateMarkup);
}

export function calculateSavings(
  retailPrice: number,
  competitorPrice: number,
): number {
  return Math.max(0, roundCurrency(competitorPrice - retailPrice));
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}
