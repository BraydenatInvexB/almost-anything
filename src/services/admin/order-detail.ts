import { createClient } from "@/lib/supabase/server";
import { DEMO_CUSTOMERS } from "@/lib/admin/demo-data";
import { getCheckoutOrder } from "@/lib/admin/operations-store";
import {
  ensureProcurementForOrder,
  ensureProcurementForSupabaseOrder,
} from "@/lib/admin/operations-persistence";
import { parseOrderItemMetadata } from "@/lib/orders/line-items";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { SEED_PRODUCTS } from "@/lib/data/seed-products";
import type { AdminOrderDetail } from "./types";
import { listAdminOrders } from "./orders";

export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  const live = getCheckoutOrder(id);
  if (live) {
    if (["paid", "sourcing", "purchased"].includes(live.status)) {
      await ensureProcurementForOrder(live);
    }

    const timeline: AdminOrderDetail["timeline"] = [
      { label: "Order placed", at: live.createdAt },
    ];
    if (["paid", "sourcing", "purchased", "shipped", "delivered"].includes(live.status)) {
      timeline.push({
        label: "Payment confirmed",
        at: new Date(new Date(live.createdAt).getTime() + 3600000).toISOString(),
        note: live.paymentMethod,
      });
    }
    if (live.stockOrigin === "overseas") {
      timeline.push({
        label: "International warehouse allocation",
        at: new Date(new Date(live.createdAt).getTime() + 86400000).toISOString(),
      });
    } else {
      timeline.push({
        label: "Picked from SA warehouse",
        at: new Date(new Date(live.createdAt).getTime() + 43200000).toISOString(),
      });
    }
    if (live.carrier || live.trackingNumber) {
      timeline.push({
        label: "Shipped",
        at: new Date(new Date(live.createdAt).getTime() + 172800000).toISOString(),
        note: live.trackingNumber ? `${live.courierName} · ${live.trackingNumber}` : live.courierName,
      });
    }

    const customer = DEMO_CUSTOMERS.find((c) => c.email === live.customerEmail);
    return {
      id: live.id,
      orderNumber: live.orderNumber,
      customerName: live.customerName,
      customerEmail: live.customerEmail,
      status: live.status,
      total: live.total,
      currency: live.currency,
      itemCount: live.itemCount,
      createdAt: live.createdAt,
      customerId: customer?.id,
      shippingAddress: live.shippingAddress,
      lineItems: live.lineItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        imageUrl: item.imageUrl,
        sku: item.sku,
        variantId: item.variantId,
        variantLabel: item.variantLabel,
        selectedOptions: item.selectedOptions,
        productId: item.productId,
      })),
      subtotal: live.subtotal,
      shippingCost: live.shippingCost,
      shippingInternalCost: live.shippingInternalCost,
      tax: live.tax,
      carrier: live.carrier ?? live.courierName,
      trackingNumber: live.trackingNumber,
      courierId: live.courierId,
      courierName: live.courierName,
      timeline,
      paymentMethod: live.paymentMethod,
      stockOrigin: live.stockOrigin,
    };
  }

  const orders = await listAdminOrders();
  const summary = orders.find((o) => o.id === id || o.orderNumber === id);
  if (!summary) return null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      let row: Record<string, unknown> | null = null;
      const byId = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (byId.data) row = byId.data as Record<string, unknown>;
      else {
        const byNum = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("order_number", id)
          .maybeSingle();
        if (byNum.data) row = byNum.data as Record<string, unknown>;
      }
      if (row) {
        const addr = (row.shipping_address ?? {}) as Record<string, unknown>;
        const meta = (row.metadata ?? {}) as Record<string, unknown>;
        const tracking = (meta.tracking ?? {}) as Record<string, unknown>;
        const items = (row.order_items ?? []) as Array<{
          id: string;
          name: string;
          quantity: number;
          unit_price: number;
          image_url: string | null;
          metadata: Record<string, unknown> | null;
        }>;
        const customer = DEMO_CUSTOMERS.find(
          (c) => c.email === ((addr.email as string) ?? "").toLowerCase(),
        );
        const status = row.status as string;
        const created = row.created_at as string;
        const timeline: AdminOrderDetail["timeline"] = [{ label: "Order placed", at: created }];
        if (["paid", "sourcing", "purchased", "shipped", "delivered"].includes(status)) {
          timeline.push({
            label: "Payment confirmed",
            at: new Date(new Date(created).getTime() + 3600000).toISOString(),
            note: (row.payment_method as string) ?? undefined,
          });
        }
        if (["paid", "sourcing", "purchased"].includes(status)) {
          await ensureProcurementForSupabaseOrder(row.id as string);
        }
        return {
          id: row.id as string,
          orderNumber: row.order_number as string,
          customerName: (addr.fullName as string) ?? "Customer",
          customerEmail: (addr.email as string) ?? "",
          status,
          total: Number(row.total),
          currency: row.currency as string,
          itemCount: items.length,
          createdAt: created,
          customerId: customer?.id,
          paymentMethod: (row.payment_method as string) ?? "Card",
          courierName: (meta.courierName as string) ?? undefined,
          stockOrigin: (meta.stockOrigin as "sa_warehouse" | "overseas") ?? undefined,
          shippingAddress: {
            fullName: (addr.fullName as string) ?? "",
            email: (addr.email as string) ?? "",
            phone: addr.phone as string | undefined,
            line1: (addr.addressLine1 as string) ?? (addr.line1 as string) ?? "",
            line2: (addr.addressLine2 as string) ?? (addr.line2 as string) ?? undefined,
            city: (addr.city as string) ?? "",
            province: (addr.state as string) ?? (addr.province as string) ?? "",
            postalCode: (addr.postalCode as string) ?? "",
            country: (addr.country as string) ?? "",
          },
          lineItems: items.map((item) => {
            const parsed = parseOrderItemMetadata(item.metadata);
            return {
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              unitPrice: Number(item.unit_price),
              imageUrl: item.image_url ?? undefined,
              ...parsed,
            };
          }),
          subtotal: Number(row.subtotal),
          shippingCost: Number(row.shipping),
          shippingInternalCost: Number(meta.shippingInternalCost ?? row.shipping),
          tax: Number(row.tax),
          carrier: (tracking.carrier as string) ?? (meta.courierName as string),
          trackingNumber: tracking.trackingNumber as string | undefined,
          courierId: (meta.courierId as string) ?? undefined,
          timeline,
        };
      }
    } catch {
      /* fall through to demo synthesis */
    }
  }

  const customer = DEMO_CUSTOMERS.find((c) => c.email === summary.customerEmail);
  const created = new Date(summary.createdAt);
  const demoShipping = summary.total > 1000 ? 0 : 99;
  const subtotal = Number((summary.total - demoShipping).toFixed(2));
  const shippingCost = demoShipping;
  const internalShipping = summary.courierName === "Aramex" ? 89 : summary.courierName === "Fastway" ? 75 : 95;

  const timeline: AdminOrderDetail["timeline"] = [
    { label: "Order placed", at: summary.createdAt },
  ];
  if (["paid", "purchased", "shipped", "delivered"].includes(summary.status)) {
    const paid = new Date(created);
    paid.setHours(paid.getHours() + 1);
    timeline.push({ label: "Payment confirmed", at: paid.toISOString() });
  }
  if (["purchased", "shipped", "delivered"].includes(summary.status)) {
    const purchased = new Date(created);
    purchased.setDate(purchased.getDate() + 1);
    timeline.push({
      label:
        summary.stockOrigin === "overseas"
          ? "International warehouse allocation"
          : "Picked from SA warehouse",
      at: purchased.toISOString(),
    });
  }
  if (["shipped", "delivered"].includes(summary.status)) {
    const shipped = new Date(created);
    shipped.setDate(shipped.getDate() + 2);
    timeline.push({
      label: "Shipped",
      at: shipped.toISOString(),
      note: `${summary.courierName ?? "Aramex"} AWB 7741 9920 18`,
    });
  }
  if (summary.status === "delivered") {
    const delivered = new Date(created);
    delivered.setDate(delivered.getDate() + 5);
    timeline.push({ label: "Delivered", at: delivered.toISOString() });
  }

  return {
    ...summary,
    customerId: customer?.id,
    shippingAddress: {
      fullName: summary.customerName,
      email: summary.customerEmail,
      phone: customer?.phone ?? "+27 82 555 0100",
      line1: "42 Main Road",
      line2: "Sandton Central",
      city: "Johannesburg",
      province: "Gauteng",
      postalCode: "2196",
      country: "South Africa",
    },
    lineItems: Array.from({ length: summary.itemCount }, (_, i) => ({
      id: `${summary.id}-item-${i}`,
      name: SEED_PRODUCTS[i % SEED_PRODUCTS.length].name,
      quantity: 1,
      unitPrice: Number((subtotal / summary.itemCount).toFixed(2)),
      imageUrl: SEED_PRODUCTS[i % SEED_PRODUCTS.length].image_url ?? undefined,
    })),
    subtotal,
    shippingCost,
    shippingInternalCost: internalShipping,
    tax: 0,
    carrier: summary.status === "shipped" || summary.status === "delivered" ? summary.courierName : undefined,
    courierName: summary.courierName,
    trackingNumber:
      summary.status === "shipped" || summary.status === "delivered"
        ? "AWB7741992018"
        : undefined,
    timeline,
    paymentMethod: summary.paymentMethod ?? "Credit / debit card",
    stockOrigin: summary.stockOrigin,
  };
}
