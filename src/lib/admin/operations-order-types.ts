import type { StockOrigin } from "@/lib/admin/operations-inventory-types";

export interface AdminProductDraft {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  retail_price: number;
  markup_percent: number;
  currency: string;
  stock_status: "in_stock" | "available_international" | "low_stock" | "out_of_stock" | "sourced";
  stock_origin: StockOrigin;
  quantity: number;
  image_url: string | null;
  source_name: string | null;
  delivery_days_min: number;
  delivery_days_max: number;
  is_featured: boolean;
  is_deal: boolean;
  show_in_hot: boolean;
  show_in_steals: boolean;
  show_in_fresh_drops: boolean;
  deal_discount_percent: number | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CheckoutOrderLineItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  stockOrigin?: StockOrigin;
  sku?: string;
  variantId?: string;
  variantLabel?: string;
  selectedOptions?: Record<string, string>;
}

export interface CheckoutOrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  shippingInternalCost: number;
  tax: number;
  currency: string;
  itemCount: number;
  createdAt: string;
  paymentMethod: string;
  courierId: string;
  courierName: string;
  carrier?: string;
  trackingNumber?: string;
  stockOrigin: StockOrigin;
  shippingAddress: {
    fullName: string;
    email: string;
    phone?: string;
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  lineItems: CheckoutOrderLineItem[];
}
