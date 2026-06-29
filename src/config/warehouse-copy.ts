/** Customer-facing warehouse labels — rotate during product search. */
export const CUSTOMER_WAREHOUSE_LABELS = [
  "South African warehouse",
  "international warehouse",
] as const;

export function warehouseFindingMessage(query: string, warehouseLabel: string): string {
  return `Finding ${query} in our ${warehouseLabel}…`;
}
