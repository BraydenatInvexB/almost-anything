import type { SupplierListing, SupplierRegion, SupplierTier } from "@/types/supplier-sourcing";

export type ManualSupplierForm = {
  supplierName: string;
  supplierUrl: string;
  listingTitle: string;
  region: SupplierRegion;
  tier: SupplierTier;
  wholesalePriceZar: string;
  wholesalePriceUsd: string;
  moq: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  city: string;
  leadTimeDaysMin: string;
  leadTimeDaysMax: string;
  notes: string;
  isPrimary: boolean;
};

export const EMPTY_SUPPLIER_FORM: ManualSupplierForm = {
  supplierName: "",
  supplierUrl: "",
  listingTitle: "",
  region: "unknown",
  tier: "wholesale",
  wholesalePriceZar: "",
  wholesalePriceUsd: "",
  moq: "",
  contactEmail: "",
  contactPhone: "",
  country: "",
  city: "",
  leadTimeDaysMin: "",
  leadTimeDaysMax: "",
  notes: "",
  isPrimary: false,
};

export function generateSupplierId(): string {
  return `sup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function parseManualSuppliers(metadata: unknown): SupplierListing[] {
  if (!metadata || typeof metadata !== "object") return [];
  const raw = (metadata as Record<string, unknown>).manualSuppliers;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isSupplierListing);
}

function isSupplierListing(value: unknown): value is SupplierListing {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === "string" && typeof row.supplierName === "string";
}

export function bootstrapManualSuppliers(input: {
  sourceName?: string | null;
  sourceUrl?: string | null;
  basePrice?: number;
  existing?: SupplierListing[];
}): SupplierListing[] {
  if (input.existing?.length) return input.existing;
  if (!input.sourceName?.trim() && !input.sourceUrl?.trim()) return [];
  return [
    {
      id: generateSupplierId(),
      supplierName: input.sourceName?.trim() || "Supplier",
      supplierUrl: input.sourceUrl?.trim() || "",
      region: "unknown",
      tier: "wholesale",
      wholesalePriceZar: input.basePrice && input.basePrice > 0 ? input.basePrice : undefined,
      isPrimary: true,
    },
  ];
}

export function listingToForm(listing: SupplierListing): ManualSupplierForm {
  return {
    supplierName: listing.supplierName,
    supplierUrl: listing.supplierUrl ?? "",
    listingTitle: listing.listingTitle ?? "",
    region: listing.region,
    tier: listing.tier,
    wholesalePriceZar: listing.wholesalePriceZar != null ? String(listing.wholesalePriceZar) : "",
    wholesalePriceUsd: listing.wholesalePriceUsd != null ? String(listing.wholesalePriceUsd) : "",
    moq: listing.moq != null ? String(listing.moq) : "",
    contactEmail: listing.contactEmail ?? "",
    contactPhone: listing.contactPhone ?? "",
    country: listing.country ?? "",
    city: listing.city ?? "",
    leadTimeDaysMin: listing.leadTimeDaysMin != null ? String(listing.leadTimeDaysMin) : "",
    leadTimeDaysMax: listing.leadTimeDaysMax != null ? String(listing.leadTimeDaysMax) : "",
    notes: listing.notes ?? "",
    isPrimary: listing.isPrimary ?? false,
  };
}

export function formToListing(form: ManualSupplierForm, id?: string): SupplierListing {
  return {
    id: id ?? generateSupplierId(),
    supplierName: form.supplierName.trim(),
    supplierUrl: form.supplierUrl.trim(),
    listingTitle: form.listingTitle.trim() || undefined,
    region: form.region,
    tier: form.tier,
    wholesalePriceZar: form.wholesalePriceZar ? Number(form.wholesalePriceZar) : undefined,
    wholesalePriceUsd: form.wholesalePriceUsd ? Number(form.wholesalePriceUsd) : undefined,
    moq: form.moq ? Number(form.moq) : undefined,
    contactEmail: form.contactEmail.trim() || undefined,
    contactPhone: form.contactPhone.trim() || undefined,
    country: form.country.trim() || undefined,
    city: form.city.trim() || undefined,
    leadTimeDaysMin: form.leadTimeDaysMin ? Number(form.leadTimeDaysMin) : undefined,
    leadTimeDaysMax: form.leadTimeDaysMax ? Number(form.leadTimeDaysMax) : undefined,
    notes: form.notes.trim() || undefined,
    isPrimary: form.isPrimary,
  };
}

export function normalizeManualSuppliers(listings: SupplierListing[]): SupplierListing[] {
  if (!listings.length) return [];
  const hasPrimary = listings.some((item) => item.isPrimary);
  return listings.map((item, index) => ({
    ...item,
    isPrimary: hasPrimary ? Boolean(item.isPrimary) : index === 0,
  }));
}

export function primaryManualSupplier(listings: SupplierListing[]): SupplierListing | null {
  const normalized = normalizeManualSuppliers(listings);
  return normalized.find((item) => item.isPrimary) ?? normalized[0] ?? null;
}

export function syncSourceFromSuppliers(listings: SupplierListing[]): {
  source_name: string | null;
  source_url: string | null;
} {
  const primary = primaryManualSupplier(listings);
  return {
    source_name: primary?.supplierName?.trim() || null,
    source_url: primary?.supplierUrl?.trim() || null,
  };
}
