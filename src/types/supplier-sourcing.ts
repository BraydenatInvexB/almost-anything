export type SupplierRegion = "south_africa" | "international" | "unknown";
export type SupplierTier = "manufacturer" | "wholesale" | "trade" | "distributor" | "retail";

export type SupplierListing = {
  id: string;
  supplierName: string;
  supplierUrl: string;
  region: SupplierRegion;
  tier: SupplierTier;
  /** Wholesale cost in USD when known */
  wholesalePriceUsd?: number;
  /** Wholesale cost in ZAR when known */
  wholesalePriceZar?: number;
  currency?: string;
  moq?: number;
  contactEmail?: string;
  contactPhone?: string;
  country?: string;
  city?: string;
  leadTimeDaysMin?: number;
  leadTimeDaysMax?: number;
  imageUrl?: string;
  notes?: string;
  isPrimary?: boolean;
  discoveredAt?: string;
  listingTitle?: string;
};

export type ProductSupplierIntel = {
  primary: SupplierListing;
  alternates: SupplierListing[];
  searchQuery: string;
  searchedAt: string;
  cheapestWholesaleZar?: number;
  researchNotes?: string;
};

export type WholesaleSearchHit = {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  region: SupplierRegion;
  tier: SupplierTier;
  estimatedPriceUsd?: number;
  estimatedPriceZar?: number;
  /** Supplier minimum order quantity when listed (e.g. MOQ 100). */
  supplierMoq?: number;
  /** Whether the scraped price was quoted ex VAT or incl VAT. */
  priceVatStatus?: "ex" | "incl" | "unknown";
  listingImageUrl?: string;
  listingDescription?: string;
  listingSummary?: string;
  listingHighlights?: string[];
  score: number;
};
