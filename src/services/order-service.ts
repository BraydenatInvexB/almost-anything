import type { CartItem, CheckoutPayload, Order, OrderItem, ShippingAddress } from "@/types/cart";
import type { Json } from "@/types/database";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutOrder } from "@/lib/admin/operations-store";
import { ensureProcurementForSupabaseOrder } from "@/lib/admin/operations-persistence";
import type { StockOrigin } from "@/lib/admin/operations-types";
import { cartItemToLineItem } from "@/lib/orders/line-items";
import { generateOrderNumber, normalizeOrderNumber } from "@/lib/orders/order-number";

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

function paymentLabel(method: string): string {
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

function inferStockOrigin(items: CartItem[]): StockOrigin {
  const overseas = items.some((i) => i.type === "quote" || i.supplierName);
  return overseas ? "overseas" : "sa_warehouse";
}

export async function createOrder(
  payload: CheckoutPayload,
  userId?: string | null,
): Promise<Order> {
  const calculated = calculateTotals(payload.items);
  const shipping =
    payload.customerShippingCharge ?? calculated.shipping;
  const subtotal = calculated.subtotal;
  const tax = calculated.tax;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;
  const orderNumber = generateOrderNumber();
  const orderItems = mapCartToOrderItems(payload.items);
  const stockOrigin = inferStockOrigin(payload.items);

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
          metadata: {
            source: "checkout",
            courierId: payload.courierId ?? null,
            courierName: payload.courierName ?? null,
            shippingInternalCost: payload.shippingInternalCost ?? null,
            stockOrigin,
          },
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
              productId: item.productId,
              variantId: item.variantId,
              variantLabel: item.variantLabel,
              selectedOptions: item.selectedOptions,
              sku: item.slug ? `AA-${item.slug.slice(0, 12).toUpperCase()}` : undefined,
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

        if (["paid", "sourcing", "purchased"].includes(order.status)) {
          await ensureProcurementForSupabaseOrder(orderRow.id);
        }
      }
    } catch {
      // Fall through to local storage
    }
  } else {
    const live = createCheckoutOrder({
      orderNumber,
      customerName: payload.shippingAddress.fullName,
      customerEmail: payload.shippingAddress.email,
      status: payload.paymentMethod === "demo" ? "paid" : "pending",
      total,
      subtotal,
      shippingCost: shipping,
      shippingInternalCost: payload.shippingInternalCost ?? shipping,
      tax,
      currency: "ZAR",
      itemCount: payload.items.reduce((n, i) => n + i.quantity, 0),
      createdAt: order.createdAt,
      paymentMethod: paymentLabel(payload.paymentMethod),
      courierId: payload.courierId ?? "aramex",
      courierName: payload.courierName ?? "Aramex",
      stockOrigin,
      shippingAddress: {
        fullName: payload.shippingAddress.fullName,
        email: payload.shippingAddress.email,
        phone: payload.shippingAddress.phone,
        line1: payload.shippingAddress.addressLine1,
        line2: payload.shippingAddress.addressLine2,
        city: payload.shippingAddress.city,
        province: payload.shippingAddress.state,
        postalCode: payload.shippingAddress.postalCode,
        country: payload.shippingAddress.country,
      },
      lineItems: payload.items.map((item) => ({
        ...cartItemToLineItem({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.imageUrl,
          productId: item.productId,
          variantId: item.variantId,
          variantLabel: item.variantLabel,
          selectedOptions: item.selectedOptions,
          slug: item.slug,
        }),
        stockOrigin: item.type === "quote" ? "overseas" : stockOrigin,
      })),
    });
    order.id = live.id;
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
  const normalized = normalizeOrderNumber(orderNumber);
  const candidates = [...new Set([orderNumber.trim(), normalized].filter(Boolean))];

  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceClient();
      for (const candidate of candidates) {
        const { data: o, error } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("order_number", candidate)
          .maybeSingle();

        if (!error && o) {
          return mapDbOrder(o as DbOrderRow);
        }
      }
    } catch {
      return null;
    }
  }

  return null;
}

export { calculateTotals, generateOrderNumber };
