import type { OrderStatus } from "@/types/cart";
import { findOrderByNumber } from "@/lib/orders/order-number";

export interface TrackedItem {
  name: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

export interface TrackedOrder {
  orderNumber: string;
  status: OrderStatus;
  placedAt: string;
  estimatedDelivery: string;
  carrier: string;
  trackingNumber: string;
  items: TrackedItem[];
  recipient: string;
  city: string;
  total: number;
}

const IMG = (id: string) => `https://images.unsplash.com/${id}?w=200&h=200&fit=crop`;

/**
 * Sample orders so the tracking experience is always demonstrable without a
 * connected database. Real orders (when Supabase is configured) are merged on
 * top of these in the track screen.
 */
export const DEMO_TRACKED_ORDERS: TrackedOrder[] = [
  {
    orderNumber: "AA4821",
    status: "shipped",
    placedAt: "2026-06-24T10:12:00Z",
    estimatedDelivery: "2026-06-29",
    carrier: "Aramex",
    trackingNumber: "77419920",
    items: [
      { name: "SilentPro ANC Headphones", quantity: 1, price: 4035.6, imageUrl: IMG("photo-1505740420928-5e560c06d30e") },
      { name: "BoltCharge 65W GaN Charger", quantity: 1, price: 637.2, imageUrl: IMG("photo-1588872657578-7efd1f1555ed") },
    ],
    recipient: "Thandi M.",
    city: "Cape Town",
    total: 4771.8,
  },
  {
    orderNumber: "AA4790",
    status: "purchased",
    placedAt: "2026-06-26T08:40:00Z",
    estimatedDelivery: "2026-07-02",
    carrier: "The Courier Guy",
    trackingNumber: "55820031",
    items: [
      { name: "AeroBook 14 Ultrabook", quantity: 1, price: 16142.4, imageUrl: IMG("photo-1496181133206-80ce9b88a853") },
    ],
    recipient: "Sipho K.",
    city: "Johannesburg",
    total: 16142.4,
  },
  {
    orderNumber: "AA4715",
    status: "delivered",
    placedAt: "2026-06-18T14:05:00Z",
    estimatedDelivery: "2026-06-23",
    carrier: "Aramex",
    trackingNumber: "77401188",
    items: [
      { name: "Crema Espresso Machine", quantity: 1, price: 6014.4, imageUrl: IMG("photo-1517668808822-9ebb02f2a0e6") },
    ],
    recipient: "Aisha P.",
    city: "Durban",
    total: 6014.4,
  },
];

export function findDemoOrder(orderNumber: string): TrackedOrder | undefined {
  return findOrderByNumber(DEMO_TRACKED_ORDERS, orderNumber, (o) => o.orderNumber);
}
