import type { StockOrigin } from "@/lib/admin/operations-types";

export type FulfillmentSource = "sa_warehouse" | "overseas" | "international";

export interface FulfillmentInfo {
  source: FulfillmentSource;
  label: string;
  description: string;
  badgeClass: string;
}

const SA_COUNTRIES = new Set(["za", "south africa", "zaf"]);

export function isDomesticCountry(country?: string | null): boolean {
  if (!country) return true;
  return SA_COUNTRIES.has(country.trim().toLowerCase());
}

export function resolveFulfillment(input: {
  stockOrigin?: StockOrigin | null;
  shippingCountry?: string | null;
}): FulfillmentInfo {
  if (!isDomesticCountry(input.shippingCountry)) {
    return {
      source: "international",
      label: "International delivery",
      description: "Shipping outside South Africa — extended lead times apply.",
      badgeClass: "bg-violet-100 text-violet-800",
    };
  }
  if (input.stockOrigin === "overseas") {
    return {
      source: "overseas",
      label: "Overseas sourcing",
      description: "Not in SA warehouse — product will be ordered from an overseas supplier.",
      badgeClass: "bg-amber-100 text-amber-800",
    };
  }
  return {
    source: "sa_warehouse",
    label: "SA warehouse",
    description: "In stock or available from the South Africa warehouse.",
    badgeClass: "bg-emerald-100 text-emerald-800",
  };
}
