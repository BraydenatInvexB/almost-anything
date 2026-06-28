export type CampaignStatus = "draft" | "scheduled" | "live" | "ended";
export type CampaignChannel = "email" | "banner" | "push" | "sms" | "multi";

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  promoCode?: string;
  discountPercent?: number;
  audience: string;
  startsAt: string;
  endsAt?: string;
  reach: number;
  clicks: number;
  createdAt: string;
}

export type ExpenseCategory =
  | "procurement"
  | "shipping"
  | "marketing"
  | "payroll"
  | "operations"
  | "refunds"
  | "other";

export interface Expense {
  id: string;
  label: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  vendor?: string;
  orderId?: string;
  recordedBy: string;
  recordedAt: string;
  notes?: string;
}

export type ReturnStatus = "requested" | "approved" | "received" | "refunded" | "rejected";

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  status: ReturnStatus;
  refundAmount: number;
  currency: string;
  createdAt: string;
  resolvedAt?: string;
}

export type StockOrigin = "sa_warehouse" | "overseas";

export interface InventoryRecord {
  productId: string;
  sku: string;
  quantity: number;
  reorderPoint: number;
  origin: StockOrigin;
  warehouse: string;
  lastCountedAt: string;
}

export type ProcurementStatus =
  | "pending"
  | "ordered"
  | "in_transit"
  | "received"
  | "cancelled";

export interface ProcurementRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  productName: string;
  supplier: string;
  supplierCountry: string;
  costPrice: number;
  sellPrice: number;
  currency: string;
  status: ProcurementStatus;
  origin: StockOrigin;
  orderedAt?: string;
  expectedAt?: string;
  receivedAt?: string;
  notes?: string;
}

export interface SiteAnalytics {
  totalVisits: number;
  uniqueSessions: number;
  pageViews: number;
  conversionRate: number;
  dailyVisits: { date: string; visits: number; orders: number }[];
  topPages: { path: string; views: number }[];
}

export interface ConfigCourier {
  id: string;
  name: string;
  baseCost: number;
  etaLabel: string;
  regions: string[];
}

export interface ExtendedPlatformConfig {
  embedShippingInPrice: boolean;
  defaultCourierId: string;
  enabledCourierIds: string[];
  currency: string;
  couriers: ConfigCourier[];
}

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
  stock_status: "in_stock" | "low_stock" | "out_of_stock" | "sourced";
  stock_origin: StockOrigin;
  quantity: number;
  image_url: string | null;
  source_name: string | null;
  delivery_days_min: number;
  delivery_days_max: number;
  is_featured: boolean;
  is_deal: boolean;
  deal_discount_percent: number | null;
  created_at: string;
  updated_at: string;
}

export interface CheckoutOrderLineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  stockOrigin?: StockOrigin;
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
