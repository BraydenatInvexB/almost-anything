export type {
  Database,
  Product,
  CustomerRequest,
  QuoteOption,
  SourcedListing,
  ProductCategory,
  QuoteTier,
  SourcingStatus,
  Json,
} from "./database";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  rating: number;
  imageUrl: string;
  category: string;
  isDeal?: boolean;
  dealLabel?: string;
  dealDiscountPercent?: number;
  isExclusive?: boolean;
}

export interface QuoteRequestPayload {
  query: string;
  budget?: number;
  urgency?: "standard" | "express" | "flexible";
  category?: string;
}

export interface QuoteOptionResponse {
  id: string;
  tier: "cheapest" | "fastest" | "best_quality";
  tierLabel: string;
  productName: string;
  supplierName: string;
  basePrice: number;
  retailPrice: number;
  deliveryDays: number;
  qualityScore: number;
  rating: number | null;
  imageUrl: string | null;
  savings?: number;
}

export interface QuoteResponse {
  requestId: string;
  query: string;
  parsedIntent: {
    productType: string;
    keywords: string[];
    attributes: string[];
    budgetRange: { min: number; max: number } | null;
  };
  options: QuoteOptionResponse[];
  generatedAt: string;
}

export interface SearchResult {
  products: ProductCardData[];
  total: number;
  query: string;
  category: string | null;
}

export interface CategoryItem {
  id: string;
  label: string;
  slug: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}
