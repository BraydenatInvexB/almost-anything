/** Approximate wholesale USD → ZAR for discovery (LLM returns USD). */
export const ZAR_PER_USD = 18.5;

/** Target markup for discovered products — keep prices competitive. */
export const DISCOVERY_TARGET_MARKUP_PERCENT = 10;
export const DISCOVERY_MAX_MARKUP_PERCENT = 16;
export const DISCOVERY_MIN_MARKUP_PERCENT = 8;

/** Wholesale unit price below this (ZAR) uses micro-pricing rules. */
export const MICRO_ITEM_THRESHOLD_ZAR = 5;

export type DiscoveryPriceResult = {
  basePriceZar: number;
  retailPrice: number;
  markupPercent: number;
  minimumOrderQuantity: number;
  unitLabel: string;
  pricingNote?: string;
  isMicroItem: boolean;
};

function roundZar(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Convert LLM wholesale figure to ZAR (values under 50 treated as USD). */
export function normalizeWholesaleToZar(amount: number): number {
  if (amount <= 0) return 0.37;
  if (amount < 50) return roundZar(amount * ZAR_PER_USD);
  if (amount < 500) return roundZar(amount * ZAR_PER_USD);
  return roundZar(amount);
}

export function isLikelyMicroProduct(query: string, name: string, category?: string): boolean {
  const text = `${query} ${name}`.toLowerCase();
  const hardware =
    /\bscrew|\bbolt|\bfastener|\bm2\b|\bm3\b|\bm4\b|\bnut\b|\bwasher|\brivet/i.test(text);
  return hardware || category === "garden" && /\bscrew|\bm2\b/i.test(text);
}

function microOrderQuantity(wholesaleZar: number): number {
  if (wholesaleZar < 0.5) return 100;
  if (wholesaleZar < 1) return 50;
  if (wholesaleZar < 2) return 25;
  return 10;
}

/**
 * Discovery pricing — low markup + MOQ for cent/low-rand items (screws, fasteners, etc.).
 */
/** Convert wholesale cost to storefront pricing. Pass `inputIsZar: true` when the amount is already ZAR (listing shelf price). */
export function calculateDiscoveryPrice(
  wholesaleInput: number,
  category: string,
  options?: { inputIsZar?: boolean },
): DiscoveryPriceResult {
  const baseZar = options?.inputIsZar
    ? roundZar(wholesaleInput)
    : normalizeWholesaleToZar(wholesaleInput);

  if (baseZar < MICRO_ITEM_THRESHOLD_ZAR) {
    const markupZar = Math.min(baseZar * 0.45, 1.25);
    let retail = roundZar(baseZar + markupZar);
    retail = Math.max(retail, 0.35);

    const moq = microOrderQuantity(baseZar);
    const markupPercent =
      baseZar > 0 ? roundZar((markupZar / baseZar) * 100) : 0;

    return {
      basePriceZar: baseZar,
      retailPrice: retail,
      markupPercent,
      minimumOrderQuantity: moq,
      unitLabel: "each",
      pricingNote: `Minimum order ${moq} units at ${formatUnitPrice(retail)} each`,
      isMicroItem: true,
    };
  }

  const markup = calculateCompetitiveMarkup(baseZar, category);

  return {
    basePriceZar: baseZar,
    retailPrice: markup.retailPrice,
    markupPercent: markup.markupPercent,
    minimumOrderQuantity: 1,
    unitLabel: "each",
    isMicroItem: false,
  };
}

/** Low competitive markup for discovered catalog items. */
function calculateCompetitiveMarkup(
  baseZar: number,
  category: string,
): { retailPrice: number; markupPercent: number } {
  let markupPercent = DISCOVERY_TARGET_MARKUP_PERCENT;
  if (category === "electronics" || category === "phones") markupPercent += 2;
  if (category === "garden") markupPercent -= 1;
  markupPercent = Math.min(
    DISCOVERY_MAX_MARKUP_PERCENT,
    Math.max(DISCOVERY_MIN_MARKUP_PERCENT, markupPercent),
  );
  const retailPrice = roundZar(baseZar * (1 + markupPercent / 100));
  return { retailPrice, markupPercent };
}

export function formatUnitPrice(amount: number): string {
  return `R ${amount.toFixed(2).replace(".", ",")}`;
}

export function parsePricingFromMetadata(metadata: unknown): {
  minimumOrderQuantity: number;
  unitLabel: string;
  pricingNote?: string;
  isMicroItem: boolean;
} {
  const raw = (metadata ?? {}) as Record<string, unknown>;
  return {
    minimumOrderQuantity:
      typeof raw.minimumOrderQuantity === "number" ? raw.minimumOrderQuantity : 1,
    unitLabel: typeof raw.unitLabel === "string" ? raw.unitLabel : "each",
    pricingNote: typeof raw.pricingNote === "string" ? raw.pricingNote : undefined,
    isMicroItem: raw.isMicroItem === true,
  };
}
