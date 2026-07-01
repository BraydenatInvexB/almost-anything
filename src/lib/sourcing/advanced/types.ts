/** Advanced sourcing agent types (web-search + tier cascade). */

export type AdvancedSourceRegion = "ZA" | "INTL";

export type AdvancedSupplierTier = 1 | 2 | 3 | 4;

export type AdvancedSupplierType =
  | "manufacturer"
  | "wholesaler"
  | "distributor"
  | "marketplace"
  | "retailer";

export const ADVANCED_TIER_BY_TYPE: Record<AdvancedSupplierType, AdvancedSupplierTier> = {
  manufacturer: 1,
  wholesaler: 1,
  distributor: 2,
  marketplace: 3,
  retailer: 4,
};

export interface AdvancedExtractedPage {
  title: string;
  price: number | null;
  currencyDetected: string | null;
  imageUrl: string | null;
  description: string;
  colours: string[];
  variants: string[];
  inStock: boolean;
  confidence: number;
  condition: "new" | "used" | "refurbished" | "unknown";
  extractionMethod: "structured-data" | "ai-text-fallback";
}
