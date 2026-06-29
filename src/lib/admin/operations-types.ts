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

export type ReturnReasonCode =
  | "damaged"
  | "wrong_item"
  | "not_as_described"
  | "changed_mind"
  | "defective"
  | "other";

export type ReturnMethod = "drop_off" | "courier_pickup" | "mail_in";

export interface ReturnLineItem {
  orderItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  returnQuantity: number;
}

export interface ReturnNote {
  id: string;
  body: string;
  authorName: string;
  authorType: "staff" | "system" | "customer";
  isInternal: boolean;
  createdAt: string;
}

export interface ReturnRequest {
  id: string;
  rmaNumber: string;
  orderId: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  reasonCode: ReturnReasonCode;
  reason: string;
  items: ReturnLineItem[];
  method: ReturnMethod;
  status: ReturnStatus;
  refundAmount: number;
  currency: string;
  restockItems: boolean;
  assignedTo?: string;
  ticketId?: string;
  rejectionReason?: string;
  notes: ReturnNote[];
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  receivedAt?: string;
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
  orderItemId?: string;
  productName: string;
  quantity: number;
  supplier: string;
  supplierCountry: string;
  supplierOrderRef?: string;
  inboundTracking?: string;
  costPrice: number;
  actualCostPaid?: number;
  sellPrice: number;
  currency: string;
  status: ProcurementStatus;
  origin: StockOrigin;
  orderedAt?: string;
  expectedAt?: string;
  receivedAt?: string;
  notes?: string;
}

export type ItemRequestStatus =
  | "pending"
  | "searching"
  | "found"
  | "quoted"
  | "purchased"
  | "shipped"
  | "delivered"
  | "failed";

export type ItemRequestUrgency = "standard" | "express" | "flexible";

export interface CustomerItemRequest {
  id: string;
  requestNumber: string;
  query: string;
  customerEmail?: string;
  budget?: number;
  currency: string;
  urgency: ItemRequestUrgency;
  status: ItemRequestStatus;
  assignedTo?: string;
  assignedToName?: string;
  internalNotes?: string;
  quotedAmount?: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
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

export type HeroStickerColor = "brand" | "blue" | "purple" | "green";
export type HeroStickerRotate = "left" | "right" | "none";

export interface HeroShowcaseItem {
  id: string;
  searchQuery: string;
  name: string;
  price: number;
  currency: string;
  deliveryDays: string;
  imageUrl: string;
  inStock: boolean;
  stockLabel?: string;
}

export interface HeroSticker {
  id: string;
  label: string;
  color: HeroStickerColor;
  rotate: HeroStickerRotate;
}

export interface HeroShowcaseConfig {
  panelLabel: string;
  buyButtonLabel: string;
  items: HeroShowcaseItem[];
  stickers: HeroSticker[];
}

export interface ExtendedPlatformConfig {
  embedShippingInPrice: boolean;
  defaultCourierId: string;
  enabledCourierIds: string[];
  currency: string;
  couriers: ConfigCourier[];
  heroShowcase: HeroShowcaseConfig;
}

export type EmailSubscriberSource = "newsletter" | "customer" | "manual";
export type EmailSubscriberStatus = "active" | "unsubscribed";

export interface EmailSubscriber {
  id: string;
  email: string;
  name?: string;
  source: EmailSubscriberSource;
  status: EmailSubscriberStatus;
  subscribedAt: string;
  tags?: string[];
}

export type EmailAudience =
  | "all"
  | "subscribers"
  | "customers"
  | "vip"
  | "active_customers";

export type EmailBroadcastStatus = "draft" | "scheduled" | "sent";

export interface EmailBroadcast {
  id: string;
  subject: string;
  previewText?: string;
  body: string;
  audience: EmailAudience;
  status: EmailBroadcastStatus;
  recipientCount: number;
  sentAt?: string;
  scheduledAt?: string;
  createdBy: string;
  createdAt: string;
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
