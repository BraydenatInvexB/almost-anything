import type { CheckoutOrderRecord, ProcurementRecord, StockOrigin } from "@/lib/admin/operations-types";
import { parseOrderItemMetadata } from "@/lib/orders/line-items";
import { mapProcurementRow } from "@/lib/supabase/operations-mappers";
import {
  asRow,
  asRows,
  DEFAULT_SUPPLIERS,
  tbl,
} from "@/lib/supabase/operations-repository-shared";

export async function listProcurement(): Promise<ProcurementRecord[]> {
  const { data, error } = await tbl("procurement_records")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapProcurementRow(r));
}

export async function listProcurementByOrder(
  orderId: string,
  orderNumber?: string,
): Promise<ProcurementRecord[]> {
  let query = tbl("procurement_records").select("*");
  if (orderNumber) {
    query = query.or(`order_id.eq.${orderId},order_number.eq.${orderNumber}`);
  } else {
    query = query.eq("order_id", orderId);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapProcurementRow(r));
}

export async function createProcurement(
  input: Omit<ProcurementRecord, "id"> & { id?: string },
): Promise<ProcurementRecord> {
  const { data, error } = await tbl("procurement_records")
    .insert({
      id: input.id,
      order_id: input.orderId,
      order_number: input.orderNumber,
      order_item_id: input.orderItemId ?? null,
      product_name: input.productName,
      quantity: input.quantity,
      supplier: input.supplier,
      supplier_country: input.supplierCountry,
      supplier_order_ref: input.supplierOrderRef ?? null,
      inbound_tracking: input.inboundTracking ?? null,
      cost_price: input.costPrice,
      actual_cost_paid: input.actualCostPaid ?? null,
      sell_price: input.sellPrice,
      currency: input.currency,
      status: input.status,
      origin: input.origin,
      ordered_at: input.orderedAt ?? null,
      expected_at: input.expectedAt ?? null,
      received_at: input.receivedAt ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapProcurementRow(asRow(data));
}

export async function updateProcurement(
  id: string,
  patch: Partial<ProcurementRecord>,
): Promise<ProcurementRecord | null> {
  const update: Record<string, unknown> = {};
  if (patch.orderId !== undefined) update.order_id = patch.orderId;
  if (patch.orderNumber !== undefined) update.order_number = patch.orderNumber;
  if (patch.orderItemId !== undefined) update.order_item_id = patch.orderItemId;
  if (patch.productName !== undefined) update.product_name = patch.productName;
  if (patch.quantity !== undefined) update.quantity = patch.quantity;
  if (patch.supplier !== undefined) update.supplier = patch.supplier;
  if (patch.supplierCountry !== undefined) update.supplier_country = patch.supplierCountry;
  if (patch.supplierOrderRef !== undefined) update.supplier_order_ref = patch.supplierOrderRef;
  if (patch.inboundTracking !== undefined) update.inbound_tracking = patch.inboundTracking;
  if (patch.costPrice !== undefined) update.cost_price = patch.costPrice;
  if (patch.actualCostPaid !== undefined) update.actual_cost_paid = patch.actualCostPaid;
  if (patch.sellPrice !== undefined) update.sell_price = patch.sellPrice;
  if (patch.currency !== undefined) update.currency = patch.currency;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.origin !== undefined) update.origin = patch.origin;
  if (patch.orderedAt !== undefined) update.ordered_at = patch.orderedAt;
  if (patch.expectedAt !== undefined) update.expected_at = patch.expectedAt;
  if (patch.receivedAt !== undefined) update.received_at = patch.receivedAt;
  if (patch.notes !== undefined) update.notes = patch.notes;

  const { data, error } = await tbl("procurement_records")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapProcurementRow(asRow(data)) : null;
}

export async function ensureProcurementForOrder(order: CheckoutOrderRecord): Promise<ProcurementRecord[]> {
  const existing = await listProcurementByOrder(order.id, order.orderNumber);
  const created: ProcurementRecord[] = [];

  for (const item of order.lineItems) {
    const dup = existing.find(
      (p) => p.orderItemId === item.id || (p.productName === item.name && !p.orderItemId),
    );
    if (dup) continue;

    const origin: StockOrigin = order.stockOrigin ?? item.stockOrigin ?? "overseas";
    const supplier = DEFAULT_SUPPLIERS[origin];
    const costEstimate = Number((item.unitPrice * 0.55).toFixed(2));

    const record = await createProcurement({
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderItemId: item.id,
      productName: item.name,
      quantity: item.quantity,
      supplier: supplier.name,
      supplierCountry: supplier.country,
      costPrice: costEstimate,
      sellPrice: item.unitPrice,
      currency: order.currency,
      status: "pending",
      origin,
      notes: item.variantLabel
        ? `Variant: ${item.variantLabel}${item.selectedOptions ? ` · ${JSON.stringify(item.selectedOptions)}` : ""}`
        : undefined,
    });
    created.push(record);
  }

  return created;
}

export async function ensureProcurementForSupabaseOrder(orderId: string): Promise<ProcurementRecord[]> {
  const { data: order, error: orderErr } = await tbl("orders")
    .select("id, order_number, currency, metadata")
    .eq("id", orderId)
    .maybeSingle();
  if (orderErr) throw orderErr;
  if (!order) return [];

  const orderRow = asRow(order);
  const { data: items, error: itemsErr } = await tbl("order_items")
    .select("id, name, unit_price, quantity, metadata")
    .eq("order_id", orderId);
  if (itemsErr) throw itemsErr;

  const meta = (orderRow.metadata ?? {}) as Record<string, unknown>;
  const stockOrigin = (meta.stockOrigin as StockOrigin) ?? "overseas";
  const itemRows = asRows(items);

  const checkout: CheckoutOrderRecord = {
    id: String(orderRow.id),
    orderNumber: String(orderRow.order_number),
    customerName: "",
    customerEmail: "",
    status: "paid",
    total: 0,
    subtotal: 0,
    shippingCost: 0,
    shippingInternalCost: 0,
    tax: 0,
    currency: String(orderRow.currency),
    itemCount: itemRows.length,
    createdAt: new Date().toISOString(),
    paymentMethod: "",
    courierId: "",
    courierName: "",
    stockOrigin,
    shippingAddress: {
      fullName: "",
      email: "",
      line1: "",
      city: "",
      province: "",
      postalCode: "",
      country: "",
    },
    lineItems: itemRows.map((item) => {
      const im = parseOrderItemMetadata(item.metadata as Record<string, unknown> | null);
      return {
        id: String(item.id),
        name: String(item.name),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        stockOrigin,
        sku: im.sku,
        variantId: im.variantId,
        variantLabel: im.variantLabel,
        selectedOptions: im.selectedOptions,
        productId: im.productId,
      };
    }),
  };

  return ensureProcurementForOrder(checkout);
}

export async function receiveProcurement(id: string): Promise<ProcurementRecord | null> {
  const proc = await updateProcurement(id, {
    status: "received",
    receivedAt: new Date().toISOString(),
  });
  if (!proc || proc.status !== "received") return proc;

  const { data: invRows } = await tbl("inventory_records")
    .select("*")
    .ilike("sku", `%${proc.productName.slice(0, 6)}%`)
    .limit(1);
  if (invRows?.[0]) {
    const inv = asRow(invRows[0]);
    await tbl("inventory_records")
      .update({
        quantity: Number(inv.quantity) + proc.quantity,
        last_counted_at: new Date().toISOString(),
      })
      .eq("product_id", String(inv.product_id));
  }

  const orderProc = await listProcurementByOrder(proc.orderId, proc.orderNumber);
  const allReceived = orderProc.every((p) => p.status === "received");
  if (allReceived) {
    await tbl("orders")
      .update({ status: "purchased" })
      .eq("id", proc.orderId)
      .in("status", ["paid", "sourcing"]);
  }

  return proc;
}
