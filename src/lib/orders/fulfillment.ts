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
      description: "Cross-border shipment — extended lead times may apply.",
      badgeClass: "bg-violet-100 text-violet-800",
    };
  }
  if (input.stockOrigin === "overseas") {
    return {
      source: "overseas",
      label: "International warehouse",
      description: "Available from our international warehouse — inbound to SA hub, then customer delivery.",
      badgeClass: "bg-blue-100 text-blue-800",
    };
  }
  return {
    source: "sa_warehouse",
    label: "SA warehouse",
    description: "Ready from the Johannesburg distribution centre.",
    badgeClass: "bg-emerald-100 text-emerald-800",
  };
}
