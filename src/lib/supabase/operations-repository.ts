import type { SupplierPayable } from "@/lib/admin/finance-types";
import type {
  Campaign,
  CheckoutOrderRecord,
  CustomerItemRequest,
  EmailBroadcast,
  EmailSubscriber,
  Expense,
  InventoryRecord,
  ProcurementRecord,
  ReturnRequest,
  SiteAnalytics,
  StockOrigin,
} from "@/lib/admin/operations-types";
import type { LiveChatMessage, LiveChatSession } from "@/lib/admin/chat-types";
import { createServiceClient } from "@/lib/supabase/admin";
import { parseOrderItemMetadata } from "@/lib/orders/line-items";
import {
  buildAnalytics,
  mapCampaignRow,
  mapChatMessageRow,
  mapChatSessionRow,
  mapEmailBroadcastRow,
  mapEmailSubscriberRow,
  mapExpenseRow,
  mapInventoryRow,
  mapItemRequestRow,
  mapPayableRow,
  mapProcurementRow,
  mapReturnRow,
} from "@/lib/supabase/operations-mappers";
import type { CreateReturnInput } from "@/lib/admin/operations-store";

function db() {
  return createServiceClient();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tbl(name: string) {
  return db().from(name as any);
}

function asRows(data: unknown): Record<string, unknown>[] {
  return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
}

function asRow(data: unknown): Record<string, unknown> {
  return asRow(data);
}

const DEFAULT_SUPPLIERS: Record<StockOrigin, { name: string; country: string }> = {
  overseas: { name: "International warehouse hub", country: "Netherlands" },
  sa_warehouse: { name: "Johannesburg DC", country: "South Africa" },
};

// ---------------------------------------------------------------------------
// Procurement
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------
async function bootstrapInventoryFromProducts(): Promise<void> {
  const { count } = await tbl("inventory_records").select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) return;

  const { data: products } = await tbl("products").select("id, slug, stock_status");
  if (!products?.length) return;

  await tbl("inventory_records").insert(
    asRows(products).map((row) => {
      const stockStatus = String(row.stock_status ?? "sourced");
      const origin: StockOrigin = stockStatus === "in_stock" ? "sa_warehouse" : "overseas";
      const quantity = stockStatus === "in_stock" ? 12 : stockStatus === "low_stock" ? 3 : 0;
      return {
        product_id: String(row.id),
        sku: `AA-${String(row.slug).slice(0, 8).toUpperCase()}`,
        quantity,
        reorder_point: 5,
        origin,
        warehouse: origin === "sa_warehouse" ? "Johannesburg DC" : "International pipeline",
        last_counted_at: new Date().toISOString(),
      };
    }),
  );
}

export async function listInventory(): Promise<InventoryRecord[]> {
  await bootstrapInventoryFromProducts();
  const { data, error } = await tbl("inventory_records")
    .select("*")
    .order("sku", { ascending: true });
  if (error) throw error;
  return asRows(data).map((r) => mapInventoryRow(r));
}

export async function updateInventory(
  productId: string,
  patch: Partial<InventoryRecord>,
): Promise<InventoryRecord | null> {
  const update: Record<string, unknown> = { last_counted_at: new Date().toISOString() };
  if (patch.sku !== undefined) update.sku = patch.sku;
  if (patch.quantity !== undefined) update.quantity = patch.quantity;
  if (patch.reorderPoint !== undefined) update.reorder_point = patch.reorderPoint;
  if (patch.origin !== undefined) update.origin = patch.origin;
  if (patch.warehouse !== undefined) update.warehouse = patch.warehouse;

  const { data, error } = await tbl("inventory_records")
    .update(update)
    .eq("product_id", productId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapInventoryRow(asRow(data)) : null;
}

// ---------------------------------------------------------------------------
// Returns
// ---------------------------------------------------------------------------
export async function listReturns(): Promise<ReturnRequest[]> {
  const { data, error } = await tbl("return_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapReturnRow(r));
}

export async function getReturn(id: string): Promise<ReturnRequest | null> {
  const { data, error } = await tbl("return_requests")
    .select("*")
    .or(`id.eq.${id},rma_number.eq.${id}`)
    .maybeSingle();
  if (error) throw error;
  return data ? mapReturnRow(asRow(data)) : null;
}

export async function listReturnsByOrder(orderId: string): Promise<ReturnRequest[]> {
  const all = await listReturns();
  return all.filter((r) => r.orderId === orderId || r.orderNumber === orderId);
}

export async function listReturnsByEmail(email: string): Promise<ReturnRequest[]> {
  const q = email.trim().toLowerCase();
  const { data, error } = await tbl("return_requests")
    .select("*")
    .ilike("customer_email", q)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapReturnRow(r));
}

export async function createReturn(input: CreateReturnInput): Promise<ReturnRequest> {
  const now = new Date().toISOString();
  const rmaNumber = `RMA-${Math.floor(Math.random() * 90000) + 10000}`;
  const notes = input.notes ?? [];

  const { data, error } = await tbl("return_requests")
    .insert({
      rma_number: rmaNumber,
      order_id: input.orderId.match(/^[0-9a-f-]{36}$/i) ? input.orderId : null,
      order_number: input.orderNumber,
      user_id: input.customerId?.match(/^[0-9a-f-]{36}$/i) ? input.customerId : null,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      reason_code: input.reasonCode,
      reason: input.reason,
      items: input.items,
      method: input.method,
      status: "requested",
      refund_amount: input.refundAmount,
      currency: input.currency,
      restock_items: input.restockItems,
      assigned_to: input.assignedTo ?? null,
      ticket_id: input.ticketId ?? null,
      notes,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return mapReturnRow(asRow(data));
}

export async function updateReturn(
  id: string,
  patch: Partial<ReturnRequest>,
): Promise<ReturnRequest | null> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.refundAmount !== undefined) update.refund_amount = patch.refundAmount;
  if (patch.restockItems !== undefined) update.restock_items = patch.restockItems;
  if (patch.assignedTo !== undefined) update.assigned_to = patch.assignedTo;
  if (patch.rejectionReason !== undefined) update.rejection_reason = patch.rejectionReason;
  if (patch.notes !== undefined) update.notes = patch.notes;
  if (patch.approvedAt !== undefined) update.approved_at = patch.approvedAt;
  if (patch.receivedAt !== undefined) update.received_at = patch.receivedAt;
  if (patch.resolvedAt !== undefined) update.resolved_at = patch.resolvedAt;

  const { data, error } = await tbl("return_requests")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapReturnRow(asRow(data)) : null;
}

export async function addReturnNote(
  returnId: string,
  note: Omit<ReturnRequest["notes"][number], "id" | "createdAt">,
): Promise<ReturnRequest | null> {
  const existing = await getReturn(returnId);
  if (!existing) return null;
  const entry = {
    ...note,
    id: `rn-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  return updateReturn(existing.id, { notes: [...existing.notes, entry] });
}

// ---------------------------------------------------------------------------
// Item requests
// ---------------------------------------------------------------------------
export async function listItemRequests(): Promise<CustomerItemRequest[]> {
  const { data, error } = await tbl("customer_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapItemRequestRow(r));
}

export async function getItemRequest(id: string): Promise<CustomerItemRequest | null> {
  const { data, error } = await tbl("customer_requests")
    .select("*")
    .or(`id.eq.${id},request_number.ilike.${id}`)
    .maybeSingle();
  if (error) throw error;
  return data ? mapItemRequestRow(asRow(data)) : null;
}

export async function createItemRequest(input: {
  id?: string;
  query: string;
  customerEmail?: string;
  budget?: number;
  currency?: string;
  urgency?: CustomerItemRequest["urgency"];
  userId?: string;
}): Promise<CustomerItemRequest> {
  const now = new Date().toISOString();
  const requestNumber = `REQ-${Math.floor(Math.random() * 90000) + 10000}`;
  const id = input.id ?? `req-${Date.now()}`;

  const { data, error } = await tbl("customer_requests")
    .insert({
      id,
      user_id: input.userId ?? null,
      query: input.query.trim(),
      request_number: requestNumber,
      customer_email: input.customerEmail?.trim().toLowerCase() ?? null,
      budget: input.budget ?? null,
      currency: input.currency ?? "ZAR",
      urgency: input.urgency ?? "standard",
      status: "searching",
      parsed_intent: {
        query: input.query,
        budget: input.budget ?? null,
        email: input.customerEmail ?? null,
        urgency: input.urgency ?? "standard",
      },
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return mapItemRequestRow(asRow(data));
}

export async function updateItemRequest(
  id: string,
  patch: Partial<CustomerItemRequest>,
): Promise<CustomerItemRequest | null> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.assignedTo !== undefined) update.assigned_to = patch.assignedTo;
  if (patch.internalNotes !== undefined) update.internal_notes = patch.internalNotes;
  if (patch.quotedAmount !== undefined) update.quoted_amount = patch.quotedAmount;
  if (patch.budget !== undefined) update.budget = patch.budget;
  if (patch.urgency !== undefined) update.urgency = patch.urgency;
  if (patch.customerEmail !== undefined) update.customer_email = patch.customerEmail;

  const { data, error } = await tbl("customer_requests")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapItemRequestRow(asRow(data)) : null;
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------
export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await tbl("expenses")
    .select("*")
    .order("recorded_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapExpenseRow(r));
}

export async function createExpense(
  input: Omit<Expense, "id" | "recordedAt">,
): Promise<Expense> {
  const { data, error } = await tbl("expenses")
    .insert({
      label: input.label,
      category: input.category,
      amount: input.amount,
      currency: input.currency,
      vendor: input.vendor ?? null,
      order_id: input.orderId ?? null,
      recorded_by: input.recordedBy,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapExpenseRow(asRow(data));
}

export async function listPayables(): Promise<SupplierPayable[]> {
  const { data, error } = await tbl("supplier_payables")
    .select("*")
    .order("due_date", { ascending: true });
  if (error) throw error;
  return asRows(data).map((r) => mapPayableRow(r));
}

export async function createPayable(
  input: Omit<SupplierPayable, "id" | "createdAt">,
): Promise<SupplierPayable> {
  const { data, error } = await tbl("supplier_payables")
    .insert({
      invoice_number: input.invoiceNumber,
      vendor: input.vendor,
      category: input.category,
      amount: input.amount,
      currency: input.currency,
      due_date: input.dueDate,
      status: input.status,
      order_id: input.orderId ?? null,
      order_number: input.orderNumber ?? null,
      procurement_id: input.procurementId ?? null,
      notes: input.notes ?? null,
      paid_at: input.paidAt ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapPayableRow(asRow(data));
}

export async function updatePayable(
  id: string,
  patch: Partial<SupplierPayable>,
): Promise<SupplierPayable | null> {
  const update: Record<string, unknown> = {};
  if (patch.invoiceNumber !== undefined) update.invoice_number = patch.invoiceNumber;
  if (patch.vendor !== undefined) update.vendor = patch.vendor;
  if (patch.category !== undefined) update.category = patch.category;
  if (patch.amount !== undefined) update.amount = patch.amount;
  if (patch.currency !== undefined) update.currency = patch.currency;
  if (patch.dueDate !== undefined) update.due_date = patch.dueDate;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.orderId !== undefined) update.order_id = patch.orderId;
  if (patch.orderNumber !== undefined) update.order_number = patch.orderNumber;
  if (patch.procurementId !== undefined) update.procurement_id = patch.procurementId;
  if (patch.notes !== undefined) update.notes = patch.notes;
  if (patch.paidAt !== undefined) update.paid_at = patch.paidAt;

  const { data, error } = await tbl("supplier_payables")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapPayableRow(asRow(data)) : null;
}

// ---------------------------------------------------------------------------
// Marketing
// ---------------------------------------------------------------------------
export async function listCampaigns(): Promise<Campaign[]> {
  const { data, error } = await tbl("marketing_campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapCampaignRow(r));
}

export async function createCampaign(
  input: Omit<Campaign, "id" | "reach" | "clicks" | "createdAt">,
): Promise<Campaign> {
  const { data, error } = await tbl("marketing_campaigns")
    .insert({
      name: input.name,
      channel: input.channel,
      status: input.status,
      promo_code: input.promoCode ?? null,
      discount_percent: input.discountPercent ?? null,
      audience: input.audience,
      starts_at: input.startsAt ?? null,
      ends_at: input.endsAt ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapCampaignRow(asRow(data));
}

export async function updateCampaign(
  id: string,
  patch: Partial<Campaign>,
): Promise<Campaign | null> {
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.channel !== undefined) update.channel = patch.channel;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.promoCode !== undefined) update.promo_code = patch.promoCode;
  if (patch.discountPercent !== undefined) update.discount_percent = patch.discountPercent;
  if (patch.audience !== undefined) update.audience = patch.audience;
  if (patch.startsAt !== undefined) update.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) update.ends_at = patch.endsAt;
  if (patch.reach !== undefined) update.reach = patch.reach;
  if (patch.clicks !== undefined) update.clicks = patch.clicks;

  const { data, error } = await tbl("marketing_campaigns")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapCampaignRow(asRow(data)) : null;
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await tbl("marketing_campaigns").delete().eq("id", id);
  if (error) throw error;
}

export async function listEmailSubscribers(): Promise<EmailSubscriber[]> {
  const { data, error } = await tbl("email_marketing_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapEmailSubscriberRow(r));
}

export async function addEmailSubscriber(
  input: Omit<EmailSubscriber, "id" | "subscribedAt"> & { id?: string },
): Promise<EmailSubscriber> {
  const email = input.email.toLowerCase();
  const { data: existing } = await tbl("email_marketing_subscribers")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    const row = asRow(existing);
    if (row.status === "unsubscribed") {
      const { data: updated } = await tbl("email_marketing_subscribers")
        .update({ status: "active", subscribed_at: new Date().toISOString() })
        .eq("id", String(row.id))
        .select()
        .single();
      return mapEmailSubscriberRow(asRow(updated));
    }
    return mapEmailSubscriberRow(row);
  }

  const { data, error } = await tbl("email_marketing_subscribers")
    .insert({
      id: input.id,
      email,
      name: input.name ?? null,
      source: input.source,
      status: input.status ?? "active",
      tags: input.tags ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return mapEmailSubscriberRow(asRow(data));
}

export async function removeEmailSubscriber(id: string): Promise<boolean> {
  const { error } = await tbl("email_marketing_subscribers").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function updateEmailSubscriber(
  id: string,
  patch: Partial<EmailSubscriber>,
): Promise<EmailSubscriber | null> {
  const update: Record<string, unknown> = {};
  if (patch.email !== undefined) update.email = patch.email.toLowerCase();
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.source !== undefined) update.source = patch.source;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.tags !== undefined) update.tags = patch.tags;

  const { data, error } = await tbl("email_marketing_subscribers")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapEmailSubscriberRow(asRow(data)) : null;
}

export async function listEmailBroadcasts(): Promise<EmailBroadcast[]> {
  const { data, error } = await tbl("email_broadcasts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapEmailBroadcastRow(r));
}

export async function createEmailBroadcast(
  input: Omit<EmailBroadcast, "id" | "createdAt" | "recipientCount" | "status"> & {
    status?: EmailBroadcast["status"];
    recipientCount?: number;
  },
): Promise<EmailBroadcast> {
  const { data, error } = await tbl("email_broadcasts")
    .insert({
      subject: input.subject,
      preview_text: input.previewText ?? null,
      body: input.body,
      audience: input.audience,
      status: input.status ?? "draft",
      recipient_count: input.recipientCount ?? 0,
      sent_at: input.sentAt ?? null,
      scheduled_at: input.scheduledAt ?? null,
      created_by: input.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return mapEmailBroadcastRow(asRow(data));
}

export async function updateEmailBroadcast(
  id: string,
  patch: Partial<EmailBroadcast>,
): Promise<EmailBroadcast | null> {
  const update: Record<string, unknown> = {};
  if (patch.subject !== undefined) update.subject = patch.subject;
  if (patch.previewText !== undefined) update.preview_text = patch.previewText;
  if (patch.body !== undefined) update.body = patch.body;
  if (patch.audience !== undefined) update.audience = patch.audience;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.recipientCount !== undefined) update.recipient_count = patch.recipientCount;
  if (patch.sentAt !== undefined) update.sent_at = patch.sentAt;
  if (patch.scheduledAt !== undefined) update.scheduled_at = patch.scheduledAt;

  const { data, error } = await tbl("email_broadcasts")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapEmailBroadcastRow(asRow(data)) : null;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
export async function getAnalytics(): Promise<SiteAnalytics> {
  const today = new Date().toISOString().slice(0, 10);
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);
  const from = fromDate.toISOString().slice(0, 10);

  const [{ data: daily }, { data: pages }, { count: orderCount }] = await Promise.all([
    tbl("site_analytics_daily").select("*").gte("date", from).order("date"),
    tbl("site_analytics_pages").select("*"),
    tbl("orders").select("*", { count: "exact", head: true }),
  ]);

  if (!daily?.length) {
    return buildAnalytics([], asRows(pages), orderCount ?? 0);
  }

  return buildAnalytics(asRows(daily), asRows(pages), orderCount ?? 0);
}

export async function recordPageVisit(path: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: dayRow } = await tbl("site_analytics_daily")
    .select("*")
    .eq("date", today)
    .maybeSingle();

  if (dayRow) {
    const row = asRow(dayRow);
    await tbl("site_analytics_daily")
      .update({
        visits: Number(row.visits) + 1,
        page_views: Number(row.page_views ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("date", today);
  } else {
    await tbl("site_analytics_daily").insert({
      date: today,
      visits: 1,
      page_views: 1,
      unique_sessions: 1,
      orders: 0,
    });
  }

  const { data: pageRow } = await tbl("site_analytics_pages")
    .select("*")
    .eq("path", path)
    .maybeSingle();

  if (pageRow) {
    const row = asRow(pageRow);
    await tbl("site_analytics_pages")
      .update({ views: Number(row.views) + 1, updated_at: new Date().toISOString() })
      .eq("path", path);
  } else {
    await tbl("site_analytics_pages").insert({ path, views: 1 });
  }
}

// ---------------------------------------------------------------------------
// Live chat
// ---------------------------------------------------------------------------
export async function listChatSessions(): Promise<LiveChatSession[]> {
  const { data: sessions, error } = await tbl("live_chat_sessions")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const sessionRows = asRows(sessions);
  if (!sessionRows.length) return [];

  const ids = sessionRows.map((s) => String(s.id));
  const { data: messages } = await tbl("live_chat_messages")
    .select("*")
    .in("session_id", ids)
    .order("created_at", { ascending: true });

  const bySession = new Map<string, LiveChatMessage[]>();
  for (const m of asRows(messages)) {
    const msg = mapChatMessageRow(m);
    const list = bySession.get(msg.sessionId) ?? [];
    list.push(msg);
    bySession.set(msg.sessionId, list);
  }

  return sessionRows.map((s) =>
    mapChatSessionRow(s, bySession.get(String(s.id)) ?? []),
  );
}

export async function getChatSession(id: string): Promise<LiveChatSession | null> {
  const { data: session, error } = await tbl("live_chat_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!session) return null;

  const { data: messages } = await tbl("live_chat_messages")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  return mapChatSessionRow(
    asRow(session),
    asRows(messages).map((m) => mapChatMessageRow(m)),
  );
}

export async function createChatSession(input: {
  visitorName: string;
  visitorEmail: string;
}): Promise<LiveChatSession> {
  const now = new Date().toISOString();
  const { data: session, error } = await tbl("live_chat_sessions")
    .insert({
      visitor_name: input.visitorName.trim(),
      visitor_email: input.visitorEmail.trim().toLowerCase(),
      status: "open",
    })
    .select()
    .single();
  if (error) throw error;

  const sessionRow = asRow(session);
  const sessionId = String(sessionRow.id);
  const { data: msg } = await tbl("live_chat_messages")
    .insert({
      session_id: sessionId,
      author_type: "system",
      author_name: "Almost Anything",
      body: "Thanks for reaching out. A team member will join shortly.",
      created_at: now,
    })
    .select()
    .single();

  return mapChatSessionRow(sessionRow, [
    mapChatMessageRow(asRow(msg)),
  ]);
}

export async function appendChatMessage(
  sessionId: string,
  input: { authorType: LiveChatMessage["authorType"]; authorName: string; body: string },
): Promise<LiveChatMessage | null> {
  const { data, error } = await tbl("live_chat_messages")
    .insert({
      session_id: sessionId,
      author_type: input.authorType,
      author_name: input.authorName,
      body: input.body.trim(),
    })
    .select()
    .single();
  if (error) throw error;

  await tbl("live_chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  return mapChatMessageRow(asRow(data));
}

export async function closeChatSession(sessionId: string): Promise<LiveChatSession | null> {
  const { data, error } = await tbl("live_chat_sessions")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return getChatSession(sessionId);
}
