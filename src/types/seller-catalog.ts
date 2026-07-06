import type { SellerDeliverySettings } from "@/lib/seller/product-pricing";

export type SellerCatalogProduct = {
  id: string;
  name: string;
  slug: string;
  base_price: number | string;
  retail_price: number | string;
  markup_percent: number | string;
  stock_quantity: number | string;
  category: string | null;
  listing_status: string | null;
  image_url: string | null;
  delivery_days_min: number | string;
  delivery_days_max: number | string;
  metadata: unknown;
};

export type SellerCatalogTab = "products" | "stock" | "add" | "import";

export type SellerCatalogShipping = {
  flatShippingFee: number;
  freeShippingThreshold: number;
  defaultMarkupPercent: number;
  freeShippingEnabled: boolean;
  flatShippingFeeEnabled: boolean;
};

export type { SellerDeliverySettings };
