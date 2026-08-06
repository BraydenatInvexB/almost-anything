export const STOCK_LOCATIONS = [
  { code: "jhb", shortLabel: "JHB", city: "Johannesburg", province: "Gauteng" },
  { code: "dbn", shortLabel: "DBN", city: "Durban", province: "KwaZulu-Natal" },
  { code: "cpt", shortLabel: "CPT", city: "Cape Town", province: "Western Cape" },
] as const;

export type StockLocationCode = (typeof STOCK_LOCATIONS)[number]["code"];
export type ProductLocationInventory = Record<StockLocationCode, number>;

export const EMPTY_LOCATION_INVENTORY: ProductLocationInventory = {
  jhb: 0,
  dbn: 0,
  cpt: 0,
};

function safeQuantity(value: unknown): number {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0;
}

export function parseLocationInventory(
  metadata: unknown,
  legacyQuantity = 0,
): ProductLocationInventory {
  const record = metadata && typeof metadata === "object"
    ? (metadata as Record<string, unknown>)
    : {};
  const saved = record.stock_locations && typeof record.stock_locations === "object"
    ? (record.stock_locations as Record<string, unknown>)
    : null;

  if (saved) {
    return {
      jhb: safeQuantity(saved.jhb),
      dbn: safeQuantity(saved.dbn),
      cpt: safeQuantity(saved.cpt),
    };
  }

  // Existing local products predate hub-level stock. Keep them purchasable,
  // but only claim Johannesburg stock until an operator allocates the units.
  const legacy = safeQuantity(record.quantity ?? legacyQuantity);
  return legacy > 0 ? { jhb: legacy, dbn: 0, cpt: 0 } : { ...EMPTY_LOCATION_INVENTORY };
}

export function totalLocationStock(inventory: ProductLocationInventory): number {
  return STOCK_LOCATIONS.reduce((total, location) => total + safeQuantity(inventory[location.code]), 0);
}

export function availableStockLocations(inventory: ProductLocationInventory) {
  return STOCK_LOCATIONS.filter((location) => safeQuantity(inventory[location.code]) > 0);
}

export function locationInventoryLabel(inventory: ProductLocationInventory): string {
  const labels = availableStockLocations(inventory).map((location) => location.shortLabel);
  return labels.length > 0 ? `In stock in ${labels.join(", ")}` : "Out of stock";
}

export function locationInventoryMetadata(inventory: ProductLocationInventory) {
  return {
    stock_locations: {
      jhb: safeQuantity(inventory.jhb),
      dbn: safeQuantity(inventory.dbn),
      cpt: safeQuantity(inventory.cpt),
    },
  };
}
