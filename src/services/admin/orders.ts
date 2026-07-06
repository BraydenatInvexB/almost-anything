import { createClient } from "@/lib/supabase/server";
import { DEMO_CUSTOMERS } from "@/lib/admin/demo-data";
import { listCheckoutOrders, getCheckoutOrder } from "@/lib/admin/operations-store";
import { listProcurementByOrder } from "@/lib/admin/operations-persistence";
import { dedupeAdminOrders } from "@/lib/orders/admin-order-dedupe";
import { QUEUE_STATUSES } from "@/lib/orders/order-operations";
import { resolveFulfillment } from "@/lib/orders/fulfillment";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { SEED_PRODUCTS } from "@/lib/data/seed-products";
import type { AdminOrderSummary } from "./types";

export function enrichOrderSummary(o: AdminOrderSummary): AdminOrderSummary {
  const fulfillment = resolveFulfillment({
    stockOrigin: o.stockOrigin,
    shippingCountry: o.shippingCountry,
  });
  return {
    ...o,
    fulfillmentSource: fulfillment.source,
    fulfillmentLabel: fulfillment.label,
  };
}

const COURIERS_DEMO = ["The Courier Guy", "Fastway", "Aramex"];
const PAYMENTS_DEMO = ["Credit / debit card", "Instant EFT", "Demo checkout"];

function buildDemoOrders(): AdminOrderSummary[] {
  const statuses = ["paid", "shipped", "delivered", "pending", "purchased", "cancelled"];
  const origins: Array<"sa_warehouse" | "overseas"> = ["sa_warehouse", "overseas"];
  const orders: AdminOrderSummary[] = [];
  for (let i = 0; i < 24; i++) {
    const cust = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
    const product = SEED_PRODUCTS[i % SEED_PRODUCTS.length];
    const qty = (i % 3) + 1;
    const d = new Date();
    d.setDate(d.getDate() - i);
    orders.push(
      enrichOrderSummary({
        id: `ord-${1000 + i}`,
        orderNumber: `AA${String(3920 - i).padStart(4, "0")}`,
        customerName: cust.full_name,
        customerEmail: cust.email,
        status: statuses[i % statuses.length],
        total: Number((product.retail_price * qty + 12).toFixed(2)),
        currency: "ZAR",
        itemCount: qty,
        createdAt: d.toISOString(),
        paymentMethod: PAYMENTS_DEMO[i % PAYMENTS_DEMO.length],
        courierName: COURIERS_DEMO[i % COURIERS_DEMO.length],
        stockOrigin: origins[i % origins.length],
        shippingCountry: i % 5 === 0 ? "United Kingdom" : "South Africa",
      }),
    );
  }
  return orders;
}

function checkoutToSummary(o: ReturnType<typeof getCheckoutOrder>): AdminOrderSummary | null {
  if (!o) return null;
  return enrichOrderSummary({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    status: o.status,
    total: o.total,
    currency: o.currency,
    itemCount: o.itemCount,
    createdAt: o.createdAt,
    paymentMethod: o.paymentMethod,
    courierName: o.courierName,
    stockOrigin: o.stockOrigin,
    shippingCountry: o.shippingAddress.country,
  });
}

export async function listAdminOrders(): Promise<AdminOrderSummary[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const res = await supabase
        .from("orders")
        .select("id, order_number, status, total, currency, shipping_address, payment_method, metadata, created_at, order_items(id)")
        .order("created_at", { ascending: false })
        .limit(100);
      const data = (res.data ?? []) as unknown as Array<{
        id: string;
        order_number: string;
        status: string;
        total: number;
        currency: string;
        payment_method: string | null;
        metadata: Record<string, unknown> | null;
        shipping_address: Record<string, unknown> | null;
        created_at: string;
        order_items: { id: string }[] | null;
      }>;
      if (!res.error) {
        const fromDb = data.map((o) => {
          const addr = (o.shipping_address ?? {}) as Record<string, unknown>;
          const meta = (o.metadata ?? {}) as Record<string, unknown>;
          return enrichOrderSummary({
            id: o.id,
            orderNumber: o.order_number,
            customerName: (addr.fullName as string) ?? "Customer",
            customerEmail: (addr.email as string) ?? "",
            status: o.status,
            total: o.total,
            currency: o.currency,
            itemCount: Array.isArray(o.order_items) ? o.order_items.length : 0,
            createdAt: o.created_at,
            paymentMethod: o.payment_method ?? undefined,
            courierName: (meta.courierName as string) ?? undefined,
            stockOrigin: (meta.stockOrigin as "sa_warehouse" | "overseas") ?? undefined,
            shippingCountry: (addr.country as string) ?? undefined,
          });
        });
        return dedupeAdminOrders(fromDb).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }
    } catch {
      /* fall through */
    }
  }
  const live = listCheckoutOrders().map((o) => checkoutToSummary(o)!);
  return dedupeAdminOrders([...live, ...buildDemoOrders()]).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getFulfillmentQueue(): Promise<AdminOrderSummary[]> {
  const orders = await listAdminOrders();
  return orders.filter((o) => QUEUE_STATUSES.includes(o.status as (typeof QUEUE_STATUSES)[number]));
}

export async function getOrderProcurement(orderId: string, orderNumber: string) {
  return listProcurementByOrder(orderId, orderNumber);
}
