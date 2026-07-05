import type { FulfillmentSource } from "@/lib/orders/fulfillment";

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: string;
  paymentMethod?: string;
  courierName?: string;
  stockOrigin?: "sa_warehouse" | "overseas";
  shippingCountry?: string;
  fulfillmentSource?: FulfillmentSource;
  fulfillmentLabel?: string;
}

export interface AdminOrderLineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  sku?: string;
  variantId?: string;
  variantLabel?: string;
  selectedOptions?: Record<string, string>;
  productId?: string;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  customerId?: string;
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
  lineItems: AdminOrderLineItem[];
  subtotal: number;
  shippingCost: number;
  shippingInternalCost?: number;
  tax: number;
  carrier?: string;
  trackingNumber?: string;
  courierId?: string;
  courierName?: string;
  timeline: { label: string; at: string; note?: string }[];
  paymentMethod: string;
  stockOrigin?: "sa_warehouse" | "overseas";
}

export interface DashboardStats {
  revenue: number;
  revenueChange: number;
  orders: number;
  ordersChange: number;
  customers: number;
  customersChange: number;
  avgOrderValue: number;
  openTickets: number;
  lowStock: number;
  activeStaff: number;
  revenueSeries: { label: string; value: number }[];
  topProducts: { name: string; sold: number; revenue: number; category?: string }[];
  topCategories: { name: string; sold: number; revenue: number }[];
  recentOrders: AdminOrderSummary[];
}

export interface ReportsSummary {
  revenueByStatus: { status: string; count: number; total: number }[];
  ordersByDay: { label: string; count: number }[];
  supportMetrics: { open: number; urgent: number; avgResponseHrs: number };
  catalogHealth: {
    inStock: number;
    availableInternational: number;
    lowStock: number;
    outOfStock: number;
  };
  fulfillmentBacklog: number;
}
