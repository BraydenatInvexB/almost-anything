import "server-only";

import { sellerDb, isSellerDbConfigured } from "@/lib/seller/db";
import {
  DELIVERY_MODE_LABELS,
  type DeliveryFulfillmentMode,
} from "@/lib/delivery/types";
import {
  getDeliverySizeInfo,
  parseDeliverySize,
  type DeliverySize,
} from "@/lib/delivery/size";
import type { DeliveryJobStatus } from "@/lib/delivery/types";
import { DELIVERY_STATUS_LABELS } from "@/lib/delivery/types";

export interface SellerOrderLine {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SellerOrderDelivery {
  jobId: string;
  mode: DeliveryFulfillmentMode;
  modeLabel: string;
  status: DeliveryJobStatus;
  statusLabel: string;
  deliverySize: DeliverySize;
  deliverySizeLabel: string;
  vehicleHint: string;
  mayNeedTwoPeople: boolean;
  addressLine: string;
  customerPhone: string | null;
}

export interface SellerOrderSummary {
  orderId: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  currency: string;
  customerName: string | null;
  /** Seller's merchandise total (ex delivery / tax). */
  goodsSubtotal: number;
  lines: SellerOrderLine[];
  /** Full order merchandise subtotal (all sellers). */
  orderSubtotal: number;
  /** Delivery fee charged to the customer on this order. */
  deliveryFee: number;
  tax: number;
  orderTotal: number;
  /** True when this seller handles delivery (single-store self-ship). */
  isSellerDelivery: boolean;
  delivery: SellerOrderDelivery | null;
}

function money(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
}

/**
 * Orders that include this seller's products, with goods vs delivery fee breakdown.
 */
export async function listSellerOrders(
  sellerId: string,
  limit = 50,
): Promise<SellerOrderSummary[]> {
  if (!isSellerDbConfigured()) return [];

  const db = sellerDb();
  const { data: items, error: itemsError } = await db
    .from("order_items")
    .select("id, order_id, name, unit_price, quantity, created_at")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (itemsError || !items?.length) return [];

  const orderIds = [...new Set(items.map((i) => i.order_id))];
  const cappedIds = orderIds.slice(0, limit);

  const [{ data: orders }, { data: jobs }] = await Promise.all([
    db
      .from("orders")
      .select(
        "id, order_number, status, subtotal, shipping, tax, total, currency, shipping_address, created_at",
      )
      .in("id", cappedIds)
      .order("created_at", { ascending: false }),
    db
      .from("delivery_jobs")
      .select("*")
      .in("order_id", cappedIds),
  ]);

  const orderById = new Map((orders ?? []).map((o) => [o.id, o]));
  const jobByOrderId = new Map(
    (jobs ?? []).map((j) => [String((j as { order_id: string }).order_id), j]),
  );

  const linesByOrder = new Map<string, SellerOrderLine[]>();
  for (const item of items) {
    if (!cappedIds.includes(item.order_id)) continue;
    const line: SellerOrderLine = {
      id: item.id,
      name: item.name,
      quantity: Number(item.quantity) || 0,
      unitPrice: money(item.unit_price),
      lineTotal: money(Number(item.unit_price) * Number(item.quantity)),
    };
    const list = linesByOrder.get(item.order_id) ?? [];
    list.push(line);
    linesByOrder.set(item.order_id, list);
  }

  const summaries: SellerOrderSummary[] = [];

  for (const orderId of cappedIds) {
    const order = orderById.get(orderId);
    if (!order) continue;
    const lines = linesByOrder.get(orderId) ?? [];
    const goodsSubtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const addr =
      order.shipping_address && typeof order.shipping_address === "object"
        ? (order.shipping_address as Record<string, unknown>)
        : {};
    const customerName =
      typeof addr.fullName === "string"
        ? addr.fullName
        : typeof addr.full_name === "string"
          ? addr.full_name
          : null;

    const rawJob = jobByOrderId.get(orderId) as Record<string, unknown> | undefined;
    const delivery = rawJob ? mapDelivery(rawJob) : null;
    const isSellerDelivery = Boolean(
      delivery && delivery.mode === "seller_self" && rawJob?.seller_id === sellerId,
    );

    summaries.push({
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
      createdAt: order.created_at,
      currency: order.currency || "ZAR",
      customerName,
      goodsSubtotal: money(goodsSubtotal),
      lines,
      orderSubtotal: money(order.subtotal),
      deliveryFee: money(order.shipping),
      tax: money(order.tax),
      orderTotal: money(order.total),
      isSellerDelivery,
      delivery,
    });
  }

  return summaries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function mapDelivery(row: Record<string, unknown>): SellerOrderDelivery {
  const mode = String(row.mode) as DeliveryFulfillmentMode;
  const status = String(row.status) as DeliveryJobStatus;
  const meta =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};
  const deliverySize = parseDeliverySize(meta.deliverySize ?? meta.delivery_size);
  const sizeInfo = getDeliverySizeInfo(deliverySize);
  const addressLine = [row.address_line1, row.city, row.province, row.postal_code]
    .filter(Boolean)
    .map(String)
    .join(", ");

  return {
    jobId: String(row.id),
    mode,
    modeLabel: DELIVERY_MODE_LABELS[mode] ?? mode,
    status,
    statusLabel: DELIVERY_STATUS_LABELS[status] ?? status,
    deliverySize,
    deliverySizeLabel:
      typeof meta.deliverySizeLabel === "string" ? meta.deliverySizeLabel : sizeInfo.label,
    vehicleHint: typeof meta.vehicleHint === "string" ? meta.vehicleHint : sizeInfo.vehicleHint,
    mayNeedTwoPeople:
      typeof meta.mayNeedTwoPeople === "boolean"
        ? meta.mayNeedTwoPeople
        : sizeInfo.mayNeedTwoPeople,
    addressLine,
    customerPhone: row.customer_phone ? String(row.customer_phone) : null,
  };
}
