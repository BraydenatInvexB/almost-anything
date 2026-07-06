import type { CartItem, Order, OrderItem, ShippingAddress } from "@/types/cart";
import type { Json } from "@/types/database";
import type { StockOrigin } from "@/lib/admin/operations-types";

interface DbOrderItem {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
  image_url: string | null;
  item_type: string;
  slug: string | null;
}

export interface DbOrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  status: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  payment_method: string | null;
  shipping_address: Json;
  created_at: string;
  order_items?: DbOrderItem[];
}

export function mapDbOrder(o: DbOrderRow): Order {
  return {
    id: o.id,
    orderNumber: o.order_number,
    status: o.status as Order["status"],
    items: (o.order_items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.unit_price),
      quantity: item.quantity,
      imageUrl: item.image_url ?? undefined,
      type: item.item_type as "product" | "quote",
      slug: item.slug ?? undefined,
    })),
    subtotal: Number(o.subtotal),
    shipping: Number(o.shipping),
    tax: Number(o.tax),
    total: Number(o.total),
    currency: o.currency,
    shippingAddress: o.shipping_address as unknown as ShippingAddress,
    paymentMethod: o.payment_method ?? "unknown",
    createdAt: o.created_at,
    userId: o.user_id ?? undefined,
  };
}

export function calculateTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal > 1000 ? 0 : 99;
  const tax = Math.round(subtotal * 0.15 * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;
  return { subtotal, shipping, tax, total };
}

export function mapCartToOrderItems(items: CartItem[]): OrderItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    imageUrl: item.imageUrl,
    type: item.type,
    slug: item.slug,
  }));
}

export function paymentLabel(method: string): string {
  switch (method) {
    case "card":
      return "Credit / debit card";
    case "eft":
      return "Instant EFT";
    case "demo":
      return "Demo checkout";
    default:
      return method;
  }
}

export function inferStockOrigin(items: CartItem[]): StockOrigin {
  const overseas = items.some((i) => i.type === "quote" || i.supplierName);
  return overseas ? "overseas" : "sa_warehouse";
}
