import type { CartItem, CheckoutPayload, Order, OrderItem, ShippingAddress } from "@/types/cart";
import type { Json } from "@/types/database";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface DbOrderItem {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
  image_url: string | null;
  item_type: string;
  slug: string | null;
}

interface DbOrderRow {
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

function mapDbOrder(o: DbOrderRow): Order {
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

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AA-${ts}-${rand}`;
}

function calculateTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal > 1000 ? 0 : 99;
  const tax = Math.round(subtotal * 0.15 * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;
  return { subtotal, shipping, tax, total };
}

function mapCartToOrderItems(items: CartItem[]): OrderItem[] {
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

export async function createOrder(
  payload: CheckoutPayload,
  userId?: string | null,
): Promise<Order> {
  const { subtotal, shipping, tax, total } = calculateTotals(payload.items);
  const orderNumber = generateOrderNumber();
  const orderItems = mapCartToOrderItems(payload.items);

  const order: Order = {
    id: crypto.randomUUID(),
    orderNumber,
    status: payload.paymentMethod === "demo" ? "paid" : "pending",
    items: orderItems,
    subtotal,
    shipping,
    tax,
    total,
    currency: "ZAR",
    shippingAddress: payload.shippingAddress,
    paymentMethod: payload.paymentMethod,
    createdAt: new Date().toISOString(),
    userId: userId ?? undefined,
  };

  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceClient();

      const { data: orderRow, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: userId ?? null,
          status: order.status,
          subtotal,
          shipping,
          tax,
          total,
          currency: "ZAR",
          payment_method: payload.paymentMethod,
          shipping_address: payload.shippingAddress as unknown as Json,
          metadata: { source: "checkout" },
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (orderRow) {
        order.id = orderRow.id;

        await supabase.from("order_items").insert(
          payload.items.map((item) => ({
            order_id: orderRow.id,
            item_type: item.type,
            name: item.name,
            slug: item.slug ?? null,
            unit_price: item.price,
            quantity: item.quantity,
            image_url: item.imageUrl ?? null,
            metadata: {
              quoteOptionId: item.quoteOptionId,
              quoteRequestId: item.quoteRequestId,
              tier: item.tier,
              supplierName: item.supplierName,
            },
          })),
        );

        if (payload.paymentMethod === "demo") {
          await supabase
            .from("orders")
            .update({ status: "sourcing" })
            .eq("id", orderRow.id);
          order.status = "sourcing";
        }
      }
    } catch {
      // Fall through to local storage
    }
  }

  return order;
}

export async function getOrdersForUser(userId?: string | null): Promise<Order[]> {
  if (userId && isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && orders) {
        return (orders as DbOrderRow[]).map(mapDbOrder);
      }
    } catch {
      // fall through
    }
  }

  return [];
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceClient();
      const { data: o, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("order_number", orderNumber)
        .single();

      if (!error && o) {
        return mapDbOrder(o as DbOrderRow);
      }
    } catch {
      return null;
    }
  }

  return null;
}

export { calculateTotals, generateOrderNumber };
