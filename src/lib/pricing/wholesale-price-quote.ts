import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";
import { isPlausibleWholesalePrice } from "@/lib/sourcing/wholesale-listing-quality";

/** South African VAT — used when supplier quotes ex VAT. */
export const SA_VAT_RATE = 0.15;

export type VatStatus = "ex" | "incl" | "unknown";

export type WholesalePriceQuote = {
  /** Per-unit wholesale cost in ZAR, ex VAT (storefront base for markup). */
  unitPriceZarExVat: number;
  vatStatus: VatStatus;
  minimumOrderQuantity: number;
  /** True when a bulk/total figure was divided by MOQ to reach the unit price. */
  derivedFromBulkTotal?: boolean;
};

function roundZar(value: number): number {
  return Math.round(value * 100) / 100;
}

export function parseVatStatus(text: string): VatStatus {
  const t = text.toLowerCase();
  if (/\b(ex\s*vat|excl\.?\s*vat|excluding\s*vat|ex\s*cl\s*vat|\+vat|plus\s*vat)\b/i.test(t)) {
    return "ex";
  }
  if (/\b(incl\.?\s*vat|including\s*vat|inc\s*vat|vat\s*incl)\b/i.test(t)) {
    return "incl";
  }
  return "unknown";
}

export function parseMinimumOrderQuantity(text: string): number | undefined {
  const patterns = [
    /(?:moq|minimum\s*order(?:\s*quantity)?|min\.?\s*order)\s*[:=]?\s*([\d,]+)/i,
    /(?:minimum|min)\s*[:=]?\s*([\d,]+)\s*(?:units?|pcs?|pieces?|sets?|cartons?)/i,
    /([\d,]+)\s*(?:units?|pcs?|pieces?|sets?)\s*(?:minimum|min\b|moq)/i,
    /order\s*(?:of\s*)?([\d,]+)\s*\+/i,
    /(?:qty|quantity)\s*[:=]?\s*([\d,]+)\s*(?:units?|pcs?|min)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const n = Number(match[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n >= 2 && n <= 10_000) return n;
  }
  return undefined;
}

function extractZarCandidates(text: string): number[] {
  const withoutDims = text
    .replace(/\d+(?:\.\d+)?\s*(?:inch|inches|"|mm|cm|l|ml|kg|g)\b/gi, " ")
    .replace(/\bM[1-9]\b/gi, " ");

  const prices: number[] = [];

  // "R 225 00" (cents separated by space)
  for (const match of withoutDims.matchAll(/R\s*([\d,]+)\s+(\d{2})(?:\s|$|\)|,|[^\d])/gi)) {
    const n = Number(`${match[1].replace(/,/g, "")}.${match[2]}`);
    if (Number.isFinite(n) && n >= 1 && n <= 500_000) prices.push(n);
  }

  // "R225.00" / "R 1,250"
  for (const match of withoutDims.matchAll(/R\s*([\d,]+(?:\.\d{1,2})?)/gi)) {
    const n = Number(match[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n >= 1 && n <= 500_000) prices.push(n);
  }

  return prices;
}

function extractUsdCandidates(text: string): number[] {
  const withoutDims = text
    .replace(/\d+(?:\.\d+)?\s*(?:inch|inches|"|mm|cm|l|ml|kg|g)\b/gi, " ")
    .replace(/\bM[1-9]\b/gi, " ");

  const prices: number[] = [];
  for (const match of withoutDims.matchAll(
    /(?:US\$|\$\s*|USD\s*)([\d,]+(?:\.\d{1,2})?)(?:\s*[-–]\s*(?:US\$|\$)?([\d,]+(?:\.\d{1,2})?))?/gi,
  )) {
    const low = Number((match[1] ?? "").replace(/,/g, ""));
    const high = match[2] ? Number(match[2].replace(/,/g, "")) : undefined;
    const usd = Number.isFinite(high) ? Math.min(low, high!) : low;
    if (Number.isFinite(usd) && usd >= 0.05 && usd <= 50_000) {
      prices.push(roundZar(usd * ZAR_PER_USD));
    }
  }
  return prices;
}

function isPerUnitPriceContext(text: string, price: number): boolean {
  const priceStr = String(Math.round(price));
  const idx = text.indexOf(priceStr);
  if (idx < 0) return false;
  const window = text.slice(Math.max(0, idx - 40), idx + priceStr.length + 40).toLowerCase();
  return /\b(per\s*unit|each|ea\b|\/\s*unit|unit\s*price|per\s*pc|per\s*piece)\b/i.test(window);
}

function isBulkTotalContext(text: string, price: number): boolean {
  const priceStr = String(Math.round(price));
  const idx = text.indexOf(priceStr);
  if (idx < 0) return false;
  const window = text.slice(Math.max(0, idx - 40), idx + priceStr.length + 40).toLowerCase();
  return /\b(total|line\s*total|order\s*value|for\s*\d+\s*(?:units?|pcs?)|carton|pallet|bulk\s*price)\b/i.test(
    window,
  );
}

function toExVat(amount: number, vatStatus: VatStatus): number {
  if (vatStatus === "incl") return roundZar(amount / (1 + SA_VAT_RATE));
  return roundZar(amount);
}

type UnitCandidate = {
  unitExVat: number;
  score: number;
  derivedFromBulkTotal: boolean;
};

function scoreUnitCandidate(
  unitExVat: number,
  query: string | undefined,
  perUnit: boolean,
  bulkTotal: boolean,
  derivedFromBulk: boolean,
): number {
  let score = 0;
  if (query && isPlausibleWholesalePrice(query, unitExVat)) score += 100;
  if (perUnit) score += 40;
  if (bulkTotal) score -= 60;
  if (derivedFromBulk) score += 10;
  if (unitExVat > 0) score += Math.max(0, 30 - unitExVat / 100);
  return score;
}

/**
 * Parse a per-unit wholesale ZAR quote from supplier listing text.
 * Handles ex/incl VAT, MOQ, and bulk totals that were mis-read as unit prices.
 */
export function parseWholesalePriceQuote(text: string, query?: string): WholesalePriceQuote | null {
  if (!text.trim()) return null;

  const vatStatus = parseVatStatus(text);
  const parsedMoq = parseMinimumOrderQuantity(text);
  const moq = parsedMoq ?? 1;

  const zarCandidates = [...extractZarCandidates(text), ...extractUsdCandidates(text)];
  const unique = [...new Set(zarCandidates.map((p) => roundZar(p)))].sort((a, b) => a - b);
  if (!unique.length) return null;

  const candidates: UnitCandidate[] = [];

  for (const raw of unique) {
    const exVat = toExVat(raw, vatStatus);
    candidates.push({
      unitExVat: exVat,
      score: scoreUnitCandidate(
        exVat,
        query,
        isPerUnitPriceContext(text, raw),
        isBulkTotalContext(text, raw),
        false,
      ),
      derivedFromBulkTotal: false,
    });

    if (moq > 1) {
      const fromBulk = toExVat(raw / moq, vatStatus);
      if (fromBulk >= 1 && fromBulk < raw) {
        candidates.push({
          unitExVat: fromBulk,
          score: scoreUnitCandidate(
            fromBulk,
            query,
            false,
            isBulkTotalContext(text, raw),
            true,
          ),
          derivedFromBulkTotal: true,
        });
      }
    }
  }

  // Prefer plausible unit prices; when MOQ > 1, strongly prefer sub-R5000 unit costs.
  const plausible = candidates.filter(
    (c) => !query || isPlausibleWholesalePrice(query, c.unitExVat),
  );
  const pool = plausible.length ? plausible : candidates;

  pool.sort((a, b) => b.score - a.score || a.unitExVat - b.unitExVat);
  const best = pool[0];
  if (!best || best.unitExVat <= 0) return null;

  // Guard: if best unit still looks like a bulk total (exact MOQ multiple of a plausible sub-price)
  if (moq > 1 && best.unitExVat > 2000 && !best.derivedFromBulkTotal) {
    const divided = roundZar(toExVat(best.unitExVat / moq, vatStatus));
    if (divided >= 20 && (!query || isPlausibleWholesalePrice(query, divided))) {
      return {
        unitPriceZarExVat: divided,
        vatStatus,
        minimumOrderQuantity: moq,
        derivedFromBulkTotal: true,
      };
    }
  }

  return {
    unitPriceZarExVat: best.unitExVat,
    vatStatus,
    minimumOrderQuantity: moq,
    derivedFromBulkTotal: best.derivedFromBulkTotal,
  };
}

/** Legacy helper — returns ZAR unit price ex VAT when possible. */
export function extractUnitPriceZarFromText(
  text: string,
  query?: string,
): { zar?: number; moq?: number; vatStatus?: VatStatus } {
  const quote = parseWholesalePriceQuote(text, query);
  if (!quote) return {};
  return {
    zar: quote.unitPriceZarExVat,
    moq: quote.minimumOrderQuantity > 1 ? quote.minimumOrderQuantity : undefined,
    vatStatus: quote.vatStatus,
  };
}
