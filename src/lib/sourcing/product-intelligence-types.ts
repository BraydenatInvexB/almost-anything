import type { ProductSupplierIntel } from "@/types/supplier-sourcing";
import type { ProductVariantsConfig } from "@/types/product-variants";

export type DiscoveredProductDraft = {
  name: string;
  slug: string;
  description: string;
  summary: string;
  category: string;
  basePrice: number;
  supplierName: string;
  supplierUrl: string;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  rating: number;
  reviewCount: number;
  highlights: string[];
  specifications: Record<string, string>;
  colours: string[];
  sizes: string[];
  variants: ProductVariantsConfig;
  candidateImageUrl?: string;
  supplierIntel?: ProductSupplierIntel;
  supplierMoq?: number;
  priceVatStatus?: "ex" | "incl" | "unknown";
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function humanize(text: string): string {
  return text
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s*--\s*/g, ", ")
    .replace(/\s+-\s+/g, ", ")
    .trim();
}
