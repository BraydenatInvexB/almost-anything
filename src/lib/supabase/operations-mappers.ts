import type { SupplierPayable } from "@/lib/admin/finance-types";
import type {
  Campaign,
  CustomerItemRequest,
  EmailBroadcast,
  EmailSubscriber,
  Expense,
  InventoryRecord,
  ProcurementRecord,
  ReturnLineItem,
  ReturnNote,
  ReturnRequest,
  SiteAnalytics,
} from "@/lib/admin/operations-types";
import type { LiveChatMessage, LiveChatSession } from "@/lib/admin/chat-types";

export function mapProcurementRow(row: Record<string, unknown>): ProcurementRecord {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    orderNumber: String(row.order_number),
    orderItemId: row.order_item_id ? String(row.order_item_id) : undefined,
    productName: String(row.product_name),
    quantity: Number(row.quantity),
    supplier: String(row.supplier),
    supplierCountry: String(row.supplier_country),
    supplierOrderRef: row.supplier_order_ref ? String(row.supplier_order_ref) : undefined,
    inboundTracking: row.inbound_tracking ? String(row.inbound_tracking) : undefined,
    costPrice: Number(row.cost_price),
    actualCostPaid: row.actual_cost_paid != null ? Number(row.actual_cost_paid) : undefined,
    sellPrice: Number(row.sell_price),
    currency: String(row.currency),
    status: row.status as ProcurementRecord["status"],
    origin: row.origin as ProcurementRecord["origin"],
    orderedAt: row.ordered_at ? String(row.ordered_at) : undefined,
    expectedAt: row.expected_at ? String(row.expected_at) : undefined,
    receivedAt: row.received_at ? String(row.received_at) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
  };
}

export function mapInventoryRow(row: Record<string, unknown>): InventoryRecord {
  return {
    productId: String(row.product_id),
    sku: String(row.sku),
    quantity: Number(row.quantity),
    reorderPoint: Number(row.reorder_point),
    origin: row.origin as InventoryRecord["origin"],
    warehouse: String(row.warehouse),
    lastCountedAt: String(row.last_counted_at),
  };
}

export function mapExpenseRow(row: Record<string, unknown>): Expense {
  return {
    id: String(row.id),
    label: String(row.label),
    category: row.category as Expense["category"],
    amount: Number(row.amount),
    currency: String(row.currency),
    vendor: row.vendor ? String(row.vendor) : undefined,
    orderId: row.order_id ? String(row.order_id) : undefined,
    recordedBy: String(row.recorded_by),
    recordedAt: String(row.recorded_at),
    notes: row.notes ? String(row.notes) : undefined,
  };
}

export function mapPayableRow(row: Record<string, unknown>): SupplierPayable {
  return {
    id: String(row.id),
    invoiceNumber: String(row.invoice_number),
    vendor: String(row.vendor),
    category: row.category as SupplierPayable["category"],
    amount: Number(row.amount),
    currency: String(row.currency),
    dueDate: String(row.due_date).slice(0, 10),
    status: row.status as SupplierPayable["status"],
    orderId: row.order_id ? String(row.order_id) : undefined,
    orderNumber: row.order_number ? String(row.order_number) : undefined,
    procurementId: row.procurement_id ? String(row.procurement_id) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at),
    paidAt: row.paid_at ? String(row.paid_at) : undefined,
  };
}

export function mapCampaignRow(row: Record<string, unknown>): Campaign {
  return {
    id: String(row.id),
    name: String(row.name),
    channel: row.channel as Campaign["channel"],
    status: row.status as Campaign["status"],
    promoCode: row.promo_code ? String(row.promo_code) : undefined,
    discountPercent: row.discount_percent != null ? Number(row.discount_percent) : undefined,
    audience: String(row.audience),
    startsAt: row.starts_at ? String(row.starts_at) : new Date().toISOString(),
    endsAt: row.ends_at ? String(row.ends_at) : undefined,
    reach: Number(row.reach),
    clicks: Number(row.clicks),
    createdAt: String(row.created_at),
  };
}

export function mapEmailSubscriberRow(row: Record<string, unknown>): EmailSubscriber {
  return {
    id: String(row.id),
    email: String(row.email),
    name: row.name ? String(row.name) : undefined,
    source: row.source as EmailSubscriber["source"],
    status: row.status as EmailSubscriber["status"],
    subscribedAt: String(row.subscribed_at),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : undefined,
  };
}

export function mapEmailBroadcastRow(row: Record<string, unknown>): EmailBroadcast {
  return {
    id: String(row.id),
    subject: String(row.subject),
    previewText: row.preview_text ? String(row.preview_text) : undefined,
    body: String(row.body),
    audience: row.audience as EmailBroadcast["audience"],
    status: row.status as EmailBroadcast["status"],
    recipientCount: Number(row.recipient_count),
    sentAt: row.sent_at ? String(row.sent_at) : undefined,
    scheduledAt: row.scheduled_at ? String(row.scheduled_at) : undefined,
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
  };
}

export function mapReturnRow(row: Record<string, unknown>): ReturnRequest {
  const items = (row.items ?? []) as ReturnLineItem[];
  const notes = (row.notes ?? []) as ReturnNote[];
  return {
    id: String(row.id),
    rmaNumber: String(row.rma_number),
    orderId: row.order_id ? String(row.order_id) : String(row.order_number),
    orderNumber: String(row.order_number),
    customerId: row.user_id ? String(row.user_id) : undefined,
    customerName: String(row.customer_name),
    customerEmail: String(row.customer_email),
    reasonCode: row.reason_code as ReturnRequest["reasonCode"],
    reason: String(row.reason),
    items,
    method: row.method as ReturnRequest["method"],
    status: row.status as ReturnRequest["status"],
    refundAmount: Number(row.refund_amount),
    currency: String(row.currency),
    restockItems: Boolean(row.restock_items),
    assignedTo: row.assigned_to ? String(row.assigned_to) : undefined,
    ticketId: row.ticket_id ? String(row.ticket_id) : undefined,
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    notes,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    approvedAt: row.approved_at ? String(row.approved_at) : undefined,
    receivedAt: row.received_at ? String(row.received_at) : undefined,
    resolvedAt: row.resolved_at ? String(row.resolved_at) : undefined,
  };
}

export function mapItemRequestRow(
  row: Record<string, unknown>,
  assignedToName?: string,
): CustomerItemRequest {
  return {
    id: String(row.id),
    requestNumber: row.request_number
      ? String(row.request_number)
      : `REQ-${String(row.id).slice(-6).toUpperCase()}`,
    query: String(row.query),
    customerEmail: row.customer_email ? String(row.customer_email) : undefined,
    budget: row.budget != null ? Number(row.budget) : undefined,
    currency: row.currency ? String(row.currency) : "ZAR",
    urgency: (row.urgency ?? "standard") as CustomerItemRequest["urgency"],
    status: row.status as CustomerItemRequest["status"],
    assignedTo: row.assigned_to ? String(row.assigned_to) : undefined,
    assignedToName,
    internalNotes: row.internal_notes ? String(row.internal_notes) : undefined,
    quotedAmount: row.quoted_amount != null ? Number(row.quoted_amount) : undefined,
    userId: row.user_id ? String(row.user_id) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapChatSessionRow(
  row: Record<string, unknown>,
  messages: LiveChatMessage[],
): LiveChatSession {
  return {
    id: String(row.id),
    visitorName: String(row.visitor_name),
    visitorEmail: String(row.visitor_email),
    status: row.status as LiveChatSession["status"],
    assignedTo: row.assigned_to ? String(row.assigned_to) : undefined,
    messages,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapChatMessageRow(row: Record<string, unknown>): LiveChatMessage {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    authorType: row.author_type as LiveChatMessage["authorType"],
    authorName: String(row.author_name),
    body: String(row.body),
    createdAt: String(row.created_at),
  };
}

export function buildAnalytics(
  dailyRows: Record<string, unknown>[],
  pageRows: Record<string, unknown>[],
  orderCount: number,
): SiteAnalytics {
  const dailyVisits = dailyRows
    .map((d) => ({
      date: String(d.date),
      visits: Number(d.visits),
      orders: Number(d.orders),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalVisits = dailyVisits.reduce((s, d) => s + d.visits, 0);
  const pageViews = dailyRows.reduce((s, d) => s + Number(d.page_views ?? 0), 0);
  const uniqueSessions = dailyRows.reduce((s, d) => s + Number(d.unique_sessions ?? 0), 0);

  const topPages = pageRows
    .map((p) => ({ path: String(p.path), views: Number(p.views) }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);

  const conversionRate =
    totalVisits > 0 ? Math.round((orderCount / totalVisits) * 10000) / 100 : 0;

  return {
    totalVisits,
    uniqueSessions,
    pageViews,
    conversionRate,
    dailyVisits,
    topPages,
  };
}
