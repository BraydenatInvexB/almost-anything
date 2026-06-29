export type {
  Database,
  Product,
  CustomerRequest,
  SourcedListing,
  ProductCategory,
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
  stockLabel?: string;
  warehouseLabel?: string;
  quantity?: number;
  unitPriceLabel?: string;
  minimumOrderQuantity?: number;
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
