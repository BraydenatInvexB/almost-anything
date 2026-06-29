export const ORDER_NUMBER_PREFIX = "AA";
export const ORDER_NUMBER_DIGITS = 4;
export const TRACK_DIGITS_STORAGE_KEY = "aa-track-digits";

/** Build a display order number from numeric digits, e.g. 1034 → AA1034 */
export function formatOrderNumber(digits: string | number): string {
  const raw = String(digits).replace(/\D/g, "");
  const padded = raw.padStart(ORDER_NUMBER_DIGITS, "0").slice(-ORDER_NUMBER_DIGITS);
  return `${ORDER_NUMBER_PREFIX}${padded}`;
}

/** Extract the digit suffix from any order number input. */
export function extractOrderDigits(input: string): string {
  const raw = input.trim().replace(/[\s-]/g, "").toUpperCase();
  if (raw.startsWith(ORDER_NUMBER_PREFIX)) {
    return raw.slice(ORDER_NUMBER_PREFIX.length).replace(/\D/g, "").slice(0, ORDER_NUMBER_DIGITS);
  }
  return raw.replace(/\D/g, "").slice(0, ORDER_NUMBER_DIGITS);
}

/** Normalize lookup input to AA#### (accepts AA1034, aa1034, 1034, legacy AA-2026-4821). */
export function normalizeOrderNumber(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const compact = trimmed.replace(/[\s-]/g, "").toUpperCase();
  if (/^AA\d+$/.test(compact)) {
    return formatOrderNumber(compact.slice(ORDER_NUMBER_PREFIX.length));
  }
  if (/^\d+$/.test(compact)) {
    return formatOrderNumber(compact);
  }

  const digits = compact.replace(/\D/g, "");
  if (digits.length >= ORDER_NUMBER_DIGITS) {
    return formatOrderNumber(digits.slice(-ORDER_NUMBER_DIGITS));
  }

  return compact;
}

export function orderNumbersMatch(a: string, b: string): boolean {
  const left = normalizeOrderNumber(a);
  const right = normalizeOrderNumber(b);
  if (left && right && left === right) return true;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function findOrderByNumber<T>(
  orders: T[],
  query: string,
  getNumber: (order: T) => string,
): T | undefined {
  return orders.find((order) => orderNumbersMatch(getNumber(order), query));
}

/** Generate AA#### for new orders. */
export function generateOrderNumber(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return formatOrderNumber(n);
}
