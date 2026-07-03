import { SEED_PRODUCTS } from "@/lib/data/seed-products";
import { COURIERS } from "@/config/couriers";
import type { Permission } from "@/config/rbac";
import type { StaffRole, StaffStatus } from "@/types/database";
import { DEMO_TICKETS, DEMO_TICKET_MESSAGES } from "@/lib/admin/demo-data";
import { orderNumbersMatch } from "@/lib/orders/order-number";
import { DEFAULT_EXTENDED_CONFIG, mergeExtendedConfig } from "@/lib/admin/extended-config-defaults";
import type { SupportTicket, TicketMessage } from "@/types/database";
import type {
  AdminProductDraft,
  Campaign,
  CheckoutOrderRecord,
  ConfigCourier,
  Expense,
  ExtendedPlatformConfig,
  EmailBroadcast,
  EmailSubscriber,
  InventoryRecord,
  ProcurementRecord,
  ReturnRequest,
  SiteAnalytics,
  StockOrigin,
  CustomerItemRequest,
} from "@/lib/admin/operations-types";

function iso(daysAgo = 0, hoursAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
}

function ticketNum() {
  return `TKT-${10400 + Math.floor(Math.random() * 900)}`;
}

interface StaffAccessOverride {
  role?: StaffRole;
  status?: StaffStatus;
  extra_permissions?: Permission[];
  denied_permissions?: Permission[];
  department?: string | null;
  title?: string | null;
}

interface OperationsState {
  campaigns: Campaign[];
  emailSubscribers: EmailSubscriber[];
  emailBroadcasts: EmailBroadcast[];
  expenses: Expense[];
  returns: ReturnRequest[];
  itemRequests: CustomerItemRequest[];
  procurement: ProcurementRecord[];
  inventory: InventoryRecord[];
  customProducts: AdminProductDraft[];
  checkoutOrders: CheckoutOrderRecord[];
  payables: import("@/lib/admin/finance-types").SupplierPayable[];
  staffOverrides: Record<string, StaffAccessOverride>;
  deletedStaffIds: string[];
  tickets: SupportTicket[];
  ticketMessages: Record<string, TicketMessage[]>;
  analytics: SiteAnalytics;
  config: ExtendedPlatformConfig;
}

const initial: OperationsState = {
  config: structuredClone(DEFAULT_EXTENDED_CONFIG),
  staffOverrides: {
    "stf-004": { denied_permissions: ["finance.view", "finance.manage", "hr.view", "hr.manage"] },
    "stf-009": { denied_permissions: ["support.view", "support.manage", "hr.view", "hr.manage"] },
    "stf-010": { denied_permissions: ["support.view", "support.manage", "finance.view", "finance.manage"] },
  },
  deletedStaffIds: [],
  campaigns: [
    {
      id: "cmp-001",
      name: "Summer Clearance",
      channel: "multi",
      status: "live",
      promoCode: "SUMMER25",
      discountPercent: 25,
      audience: "All subscribers",
      startsAt: iso(14),
      endsAt: iso(-30),
      reach: 12480,
      clicks: 598,
      createdAt: iso(20),
    },
    {
      id: "cmp-002",
      name: "New Arrivals Drop",
      channel: "email",
      status: "scheduled",
      audience: "VIP customers",
      startsAt: iso(-7),
      reach: 0,
      clicks: 0,
      createdAt: iso(5),
    },
  ],
  emailSubscribers: [
    { id: "sub-001", email: "deals@example.com", name: "Newsletter fan", source: "newsletter", status: "active", subscribedAt: iso(30) },
    { id: "sub-002", email: "gabriela@consolidated.co", name: "Gabriela Christiansen", source: "customer", status: "active", subscribedAt: iso(60), tags: ["vip"] },
    { id: "sub-003", email: "marcus.bennett@gmail.com", name: "Marcus Bennett", source: "customer", status: "active", subscribedAt: iso(45) },
    { id: "sub-004", email: "hello@almostanything.store", source: "manual", status: "active", subscribedAt: iso(10) },
  ],
  emailBroadcasts: [
    {
      id: "eml-001",
      subject: "Summer clearance — up to 25% off",
      previewText: "Fresh deals just dropped across the store.",
      body: "Hi there,\n\nOur summer clearance is live with up to 25% off thousands of items. Shop now before your favourites sell out.\n\n— Almost Anything",
      audience: "all",
      status: "sent",
      recipientCount: 8420,
      sentAt: iso(7),
      createdBy: "Amara Okafor",
      createdAt: iso(8),
    },
  ],
  expenses: [
    {
      id: "exp-001",
      label: "Supplier purchase batch #441",
      category: "procurement",
      amount: 18420,
      currency: "ZAR",
      vendor: "Global Sourcing Co",
      recordedBy: "Amara Okafor",
      recordedAt: iso(2),
    },
    {
      id: "exp-002",
      label: "Aramex monthly account",
      category: "shipping",
      amount: 4200,
      currency: "ZAR",
      vendor: "Aramex",
      recordedAt: iso(5),
      recordedBy: "Fatima Zahra",
    },
    {
      id: "exp-003",
      label: "Refund AA3915",
      category: "refunds",
      amount: 890,
      currency: "ZAR",
      orderId: "ord-1015",
      recordedBy: "Priya Nair",
      recordedAt: iso(1),
    },
    {
      id: "exp-004",
      label: "Google Ads Q2",
      category: "marketing",
      amount: 6200,
      currency: "ZAR",
      vendor: "Google",
      recordedBy: "Leo Schmidt",
      recordedAt: iso(8),
      notes: "Performance max campaigns",
    },
    {
      id: "exp-005",
      label: "Staff salaries March",
      category: "payroll",
      amount: 142000,
      currency: "ZAR",
      vendor: "Payroll",
      recordedBy: "James van Wyk",
      recordedAt: iso(12),
    },
    {
      id: "exp-006",
      label: "Fastway courier account",
      category: "shipping",
      amount: 3100,
      currency: "ZAR",
      vendor: "Fastway",
      recordedBy: "Fatima Zahra",
      recordedAt: iso(4),
    },
    {
      id: "exp-007",
      label: "Warehouse rent",
      category: "operations",
      amount: 28500,
      currency: "ZAR",
      vendor: "Sandton Industrial",
      recordedBy: "Thandi Mokoena",
      recordedAt: iso(15),
    },
    {
      id: "exp-008",
      label: "Payment gateway fees",
      category: "operations",
      amount: 1840,
      currency: "ZAR",
      vendor: "Stripe",
      recordedBy: "Thandi Mokoena",
      recordedAt: iso(3),
      notes: "Card processing fees",
    },
  ],
  payables: [
    {
      id: "pay-001",
      invoiceNumber: "INV-NHS-8842",
      vendor: "Nordic Home Supply",
      category: "procurement",
      amount: 4200,
      currency: "ZAR",
      dueDate: iso(-2),
      status: "overdue",
      orderNumber: "AA3920",
      procurementId: "proc-001",
      notes: "Long Chair overseas purchase",
      createdAt: iso(4),
    },
    {
      id: "pay-002",
      invoiceNumber: "INV-GSC-1204",
      vendor: "Global Sourcing Co",
      category: "procurement",
      amount: 18420,
      currency: "ZAR",
      dueDate: iso(7),
      status: "approved",
      createdAt: iso(2),
    },
    {
      id: "pay-003",
      invoiceNumber: "INV-ARX-331",
      vendor: "Aramex",
      category: "shipping",
      amount: 4200,
      currency: "ZAR",
      dueDate: iso(14),
      status: "pending",
      createdAt: iso(5),
    },
    {
      id: "pay-004",
      invoiceNumber: "INV-JLW-009",
      vendor: "Joburg Lighting WH",
      category: "procurement",
      amount: 680,
      currency: "ZAR",
      dueDate: iso(-10),
      status: "paid",
      orderNumber: "AA3919",
      procurementId: "proc-002",
      createdAt: iso(6),
      paidAt: iso(3),
    },
  ],
  returns: [
    {
      id: "ret-001",
      rmaNumber: "RMA-48291",
      orderId: "ord-1005",
      orderNumber: "AA3915",
      customerName: "Marcus Bennett",
      customerEmail: "marcus.bennett@gmail.com",
      reasonCode: "damaged",
      reason: "Damaged lamp shade on arrival — packaging was crushed on one corner.",
      items: [
        {
          orderItemId: "li-001",
          name: "Arc Floor Lamp",
          quantity: 1,
          unitPrice: 890,
          returnQuantity: 1,
        },
      ],
      method: "courier_pickup",
      status: "approved",
      refundAmount: 890,
      currency: "ZAR",
      restockItems: false,
      notes: [
        {
          id: "rn-001",
          body: "Customer sent photos — shade cracked. Approved for pickup.",
          authorName: "Thandi Mokoena",
          authorType: "staff",
          isInternal: true,
          createdAt: iso(2),
        },
      ],
      createdAt: iso(3),
      updatedAt: iso(2),
      approvedAt: iso(2),
    },
    {
      id: "ret-002",
      rmaNumber: "RMA-48304",
      orderId: "ord-1008",
      orderNumber: "AA3912",
      customerName: "Olivia Hughes",
      customerEmail: "olivia.h@proton.me",
      reasonCode: "wrong_item",
      reason: "Received a 2-seater instead of the 3-seater sofa I ordered.",
      items: [
        {
          orderItemId: "li-002",
          name: "Modular Corner Sofa",
          quantity: 1,
          unitPrice: 12499,
          returnQuantity: 1,
        },
      ],
      method: "courier_pickup",
      status: "requested",
      refundAmount: 12499,
      currency: "ZAR",
      restockItems: true,
      notes: [],
      createdAt: iso(1),
      updatedAt: iso(1),
    },
    {
      id: "ret-003",
      rmaNumber: "RMA-48102",
      orderId: "ord-1012",
      orderNumber: "AA3908",
      customerName: "James Okonkwo",
      customerEmail: "j.okonkwo@outlook.com",
      reasonCode: "changed_mind",
      reason: "Colour doesn't match the room after seeing it in person.",
      items: [
        {
          orderItemId: "li-003",
          name: "Velvet Accent Chair",
          quantity: 2,
          unitPrice: 2199,
          returnQuantity: 2,
        },
      ],
      method: "drop_off",
      status: "received",
      refundAmount: 4398,
      currency: "ZAR",
      restockItems: true,
      notes: [
        {
          id: "rn-002",
          body: "Items received at Johannesburg DC — condition good, tags attached.",
          authorName: "System",
          authorType: "system",
          isInternal: true,
          createdAt: iso(0),
        },
      ],
      createdAt: iso(5),
      updatedAt: iso(0),
      approvedAt: iso(4),
      receivedAt: iso(0),
    },
  ],
  itemRequests: [
    {
      id: "req-seed-001",
      requestNumber: "REQ-10482",
      query: "Vintage leather armchair, cognac brown, under R15,000",
      customerEmail: "marcus.bennett@gmail.com",
      budget: 15000,
      currency: "ZAR",
      urgency: "standard",
      status: "searching",
      assignedTo: "stf-003",
      assignedToName: "Jordan Kim",
      createdAt: iso(0, 3),
      updatedAt: iso(0, 1),
    },
    {
      id: "req-seed-002",
      requestNumber: "REQ-10471",
      query: "PlayStation 5 Digital Edition with extra controller",
      customerEmail: "gabriela@consolidated.co",
      budget: 12000,
      currency: "ZAR",
      urgency: "express",
      status: "quoted",
      assignedTo: "stf-001",
      assignedToName: "Alex Rivera",
      quotedAmount: 11499,
      internalNotes: "Supplier confirmed — quote sent to customer.",
      createdAt: iso(1, 5),
      updatedAt: iso(0, 8),
    },
    {
      id: "req-seed-003",
      requestNumber: "REQ-10455",
      query: "Mid-century dining set for 6, teak or walnut",
      customerEmail: "zara.mthembu@outlook.com",
      budget: 25000,
      currency: "ZAR",
      urgency: "flexible",
      status: "pending",
      createdAt: iso(2),
      updatedAt: iso(2),
    },
  ],
  procurement: [
    {
      id: "proc-001",
      orderId: "ord-1001",
      orderNumber: "AA3920",
      productName: "Long Chair",
      quantity: 1,
      supplier: "Nordic Home Supply",
      supplierCountry: "Netherlands",
      costPrice: 4200,
      sellPrice: 8999,
      currency: "ZAR",
      status: "in_transit",
      origin: "overseas",
      orderedAt: iso(4),
      expectedAt: iso(-3),
      supplierOrderRef: "NHS-88421",
      inboundTracking: "1Z999AA10123456784",
    },
    {
      id: "proc-002",
      orderId: "ord-1002",
      orderNumber: "AA3919",
      productName: "Arc Floor Lamp",
      quantity: 1,
      supplier: "Joburg Lighting WH",
      supplierCountry: "South Africa",
      costPrice: 680,
      sellPrice: 1299,
      currency: "ZAR",
      status: "received",
      origin: "sa_warehouse",
      orderedAt: iso(6),
      receivedAt: iso(3),
    },
  ],
  inventory: SEED_PRODUCTS.slice(0, 12).map((p, i) => ({
    productId: `seed-${p.slug}`,
    sku: `AA-${p.slug.slice(0, 8).toUpperCase()}`,
    quantity: p.stock_status === "out_of_stock" ? 0 : p.stock_status === "low_stock" ? 4 : 28 - i,
    reorderPoint: 5,
    origin: i % 3 === 0 ? ("overseas" as const) : ("sa_warehouse" as const),
    warehouse: i % 3 === 0 ? "Overseas pipeline" : "Johannesburg DC",
    lastCountedAt: iso(i % 5),
  })),
  customProducts: [],
  checkoutOrders: [],
  tickets: [...DEMO_TICKETS],
  ticketMessages: { ...DEMO_TICKET_MESSAGES },
  analytics: {
    totalVisits: 48210,
    uniqueSessions: 31680,
    pageViews: 128400,
    conversionRate: 2.8,
    dailyVisits: Array.from({ length: 7 }, (_, i) => ({
      date: iso(6 - i).slice(0, 10),
      visits: 5200 + i * 340,
      orders: 42 + i * 3,
    })),
    topPages: [
      { path: "/", views: 28400 },
      { path: "/products", views: 19200 },
      { path: "/products/playstation-5", views: 8400 },
      { path: "/cart", views: 6200 },
      { path: "/checkout", views: 4100 },
    ],
  },
};

let state: OperationsState = structuredClone(initial);

export function getOperationsState() {
  return state;
}

export function listCampaigns() {
  return state.campaigns;
}

export function createCampaign(input: Omit<Campaign, "id" | "reach" | "clicks" | "createdAt">) {
  const campaign: Campaign = {
    ...input,
    id: `cmp-${Date.now()}`,
    reach: 0,
    clicks: 0,
    createdAt: new Date().toISOString(),
  };
  state.campaigns.unshift(campaign);
  return campaign;
}

export function updateCampaign(id: string, patch: Partial<Campaign>) {
  const idx = state.campaigns.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  state.campaigns[idx] = { ...state.campaigns[idx], ...patch };
  return state.campaigns[idx];
}

export function deleteCampaign(id: string) {
  state.campaigns = state.campaigns.filter((c) => c.id !== id);
}

export function listExpenses() {
  return state.expenses;
}

export function createExpense(input: Omit<Expense, "id" | "recordedAt">) {
  const expense: Expense = {
    ...input,
    id: `exp-${Date.now()}`,
    recordedAt: new Date().toISOString(),
  };
  state.expenses.unshift(expense);
  return expense;
}

export function listPayables() {
  return state.payables;
}

export function updatePayable(
  id: string,
  patch: Partial<import("@/lib/admin/finance-types").SupplierPayable>,
) {
  const idx = state.payables.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  state.payables[idx] = { ...state.payables[idx], ...patch };
  return state.payables[idx];
}

export function createPayable(
  input: Omit<import("@/lib/admin/finance-types").SupplierPayable, "id" | "createdAt">,
) {
  const payable = {
    ...input,
    id: `pay-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  state.payables.unshift(payable);
  return payable;
}

export function listReturns() {
  return state.returns;
}

export function getReturn(id: string) {
  return state.returns.find((r) => r.id === id || r.rmaNumber === id) ?? null;
}

export function listReturnsByOrder(orderId: string) {
  const q = orderId.trim();
  return state.returns.filter(
    (r) => r.orderId === q || orderNumbersMatch(r.orderNumber, q),
  );
}

export function listReturnsByEmail(email: string) {
  const q = email.trim().toLowerCase();
  return state.returns.filter((r) => r.customerEmail.toLowerCase() === q);
}

export type CreateReturnInput = Omit<
  ReturnRequest,
  "id" | "rmaNumber" | "status" | "notes" | "createdAt" | "updatedAt"
> & { notes?: ReturnRequest["notes"] };

export function createReturn(input: CreateReturnInput) {
  const now = new Date().toISOString();
  const ret: ReturnRequest = {
    ...input,
    id: `ret-${Date.now()}`,
    rmaNumber: `RMA-${Math.floor(Math.random() * 90000) + 10000}`,
    status: "requested",
    notes: input.notes ?? [],
    createdAt: now,
    updatedAt: now,
  };
  state.returns.unshift(ret);
  return ret;
}

export function updateReturn(id: string, patch: Partial<ReturnRequest>) {
  const idx = state.returns.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  state.returns[idx] = {
    ...state.returns[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return state.returns[idx];
}

export function addReturnNote(
  returnId: string,
  note: Omit<ReturnRequest["notes"][number], "id" | "createdAt">,
) {
  const idx = state.returns.findIndex((r) => r.id === returnId);
  if (idx < 0) return null;
  const entry = {
    ...note,
    id: `rn-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  state.returns[idx] = {
    ...state.returns[idx],
    notes: [...state.returns[idx].notes, entry],
    updatedAt: new Date().toISOString(),
  };
  return state.returns[idx];
}

export function listProcurement() {
  return state.procurement;
}

export function listProcurementByOrder(orderId: string, orderNumber?: string) {
  return state.procurement.filter(
    (p) =>
      p.orderId === orderId ||
      (orderNumber != null && p.orderNumber === orderNumber),
  );
}

export type CreateProcurementInput = Omit<ProcurementRecord, "id"> & { id?: string };

export function createProcurement(input: CreateProcurementInput) {
  const record: ProcurementRecord = {
    ...input,
    id: input.id ?? `proc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    quantity: input.quantity ?? 1,
  };
  state.procurement.unshift(record);
  return record;
}

const DEFAULT_SUPPLIERS: Record<StockOrigin, { name: string; country: string }> = {
  overseas: { name: "International warehouse hub", country: "Netherlands" },
  sa_warehouse: { name: "Johannesburg DC", country: "South Africa" },
};

/** Create procurement lines for each order item when payment is confirmed (idempotent). */
export function ensureProcurementForOrder(order: CheckoutOrderRecord) {
  const existing = listProcurementByOrder(order.id, order.orderNumber);
  const created: ProcurementRecord[] = [];

  for (const item of order.lineItems) {
    const dup = existing.find(
      (p) => p.orderItemId === item.id || (p.productName === item.name && !p.orderItemId),
    );
    if (dup) continue;

    const origin: StockOrigin = order.stockOrigin ?? "overseas";
    const supplier = DEFAULT_SUPPLIERS[origin];
    const costEstimate = Number((item.unitPrice * 0.55).toFixed(2));

    const record = createProcurement({
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

export function receiveProcurement(id: string) {
  const idx = state.procurement.findIndex((p) => p.id === id);
  if (idx < 0) return null;

  const proc = state.procurement[idx];
  if (proc.status === "received") return proc;

  const now = new Date().toISOString();
  state.procurement[idx] = {
    ...proc,
    status: "received",
    receivedAt: now,
  };

  const invIdx = state.inventory.findIndex(
    (i) => i.sku && proc.productName.toLowerCase().includes(i.sku.slice(3, 8).toLowerCase()),
  );
  if (invIdx >= 0) {
    state.inventory[invIdx] = {
      ...state.inventory[invIdx],
      quantity: state.inventory[invIdx].quantity + proc.quantity,
      lastCountedAt: now,
    };
  }

  const orderProc = listProcurementByOrder(proc.orderId, proc.orderNumber);
  const allReceived = orderProc.every((p) => p.status === "received");
  if (allReceived) {
    const orderIdx = state.checkoutOrders.findIndex(
      (o) => o.id === proc.orderId || o.orderNumber === proc.orderNumber,
    );
    if (orderIdx >= 0 && ["paid", "sourcing"].includes(state.checkoutOrders[orderIdx].status)) {
      state.checkoutOrders[orderIdx] = {
        ...state.checkoutOrders[orderIdx],
        status: "purchased",
      };
    }
  }

  return state.procurement[idx];
}

export function listItemRequests() {
  return state.itemRequests;
}

export function getItemRequest(id: string) {
  return (
    state.itemRequests.find(
      (r) => r.id === id || r.requestNumber.toLowerCase() === id.toLowerCase(),
    ) ?? null
  );
}

export type CreateItemRequestInput = {
  id?: string;
  query: string;
  customerEmail?: string;
  budget?: number;
  currency?: string;
  urgency?: CustomerItemRequest["urgency"];
  userId?: string;
};

export function createItemRequest(input: CreateItemRequestInput) {
  const now = new Date().toISOString();
  const req: CustomerItemRequest = {
    id: input.id ?? `req-${Date.now()}`,
    requestNumber: `REQ-${Math.floor(Math.random() * 90000) + 10000}`,
    query: input.query.trim(),
    customerEmail: input.customerEmail?.trim().toLowerCase(),
    budget: input.budget,
    currency: input.currency ?? "ZAR",
    urgency: input.urgency ?? "standard",
    status: "searching",
    userId: input.userId,
    createdAt: now,
    updatedAt: now,
  };
  state.itemRequests.unshift(req);
  return req;
}

export function updateItemRequest(id: string, patch: Partial<CustomerItemRequest>) {
  const idx = state.itemRequests.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  state.itemRequests[idx] = {
    ...state.itemRequests[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return state.itemRequests[idx];
}

export function updateProcurement(id: string, patch: Partial<ProcurementRecord>) {
  const idx = state.procurement.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  state.procurement[idx] = { ...state.procurement[idx], ...patch };
  return state.procurement[idx];
}

export function listInventory() {
  return state.inventory;
}

export function updateInventory(productId: string, patch: Partial<InventoryRecord>) {
  const idx = state.inventory.findIndex((i) => i.productId === productId);
  if (idx < 0) return null;
  state.inventory[idx] = {
    ...state.inventory[idx],
    ...patch,
    lastCountedAt: new Date().toISOString(),
  };
  return state.inventory[idx];
}

export function listCustomProducts() {
  return state.customProducts;
}

export function getCustomProduct(id: string) {
  return state.customProducts.find((p) => p.id === id) ?? null;
}

export function createCustomProduct(input: Omit<AdminProductDraft, "id" | "created_at" | "updated_at">) {
  const now = new Date().toISOString();
  const product: AdminProductDraft = {
    ...input,
    id: `custom-${Date.now()}`,
    created_at: now,
    updated_at: now,
  };
  state.customProducts.unshift(product);
  state.inventory.unshift({
    productId: product.id,
    sku: `AA-${product.slug.slice(0, 8).toUpperCase()}`,
    quantity: input.quantity,
    reorderPoint: 5,
    origin: input.stock_origin,
    warehouse: input.stock_origin === "sa_warehouse" ? "Johannesburg DC" : "Overseas pipeline",
    lastCountedAt: now,
  });
  return product;
}

export function updateCustomProduct(id: string, patch: Partial<AdminProductDraft>) {
  const idx = state.customProducts.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const current = state.customProducts[idx];
  const base = patch.base_price ?? current.base_price;
  const markup = patch.markup_percent ?? current.markup_percent;
  const next: AdminProductDraft = {
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  if (
    patch.retail_price === undefined &&
    (patch.markup_percent !== undefined || patch.base_price !== undefined)
  ) {
    next.retail_price = Number((base * (1 + Number(markup) / 100)).toFixed(2));
  }
  state.customProducts[idx] = next;
  return state.customProducts[idx];
}

export function listOpsTickets() {
  return state.tickets;
}

export function getOpsTicketMessages(ticketId: string) {
  return state.ticketMessages[ticketId] ?? [];
}

export function addTicketMessage(
  ticketId: string,
  input: {
    author_type: "staff" | "customer";
    author_id?: string | null;
    author_name: string;
    body: string;
    is_internal?: boolean;
  },
) {
  const idx = state.tickets.findIndex((t) => t.id === ticketId);
  if (idx < 0) return null;

  const now = new Date().toISOString();
  const message: TicketMessage = {
    id: `msg-${Date.now()}`,
    ticket_id: ticketId,
    author_type: input.author_type,
    author_id: input.author_id ?? null,
    author_name: input.author_name,
    body: input.body,
    is_internal: input.is_internal ?? false,
    created_at: now,
  };

  if (!state.ticketMessages[ticketId]) state.ticketMessages[ticketId] = [];
  state.ticketMessages[ticketId].push(message);

  const ticket = state.tickets[idx];
  ticket.last_reply_at = now;
  ticket.updated_at = now;

  if (input.author_type === "staff" && !input.is_internal && ticket.status === "open") {
    ticket.status = "pending";
  }

  return message;
}

export function updateSupportTicket(
  id: string,
  patch: Partial<Pick<SupportTicket, "status" | "priority" | "assigned_to" | "category">>,
) {
  const idx = state.tickets.findIndex((t) => t.id === id);
  if (idx < 0) return null;

  const ticket = state.tickets[idx];
  const now = new Date().toISOString();
  state.tickets[idx] = {
    ...ticket,
    ...patch,
    updated_at: now,
    resolved_at:
      patch.status === "resolved" || patch.status === "closed"
        ? now
        : patch.status === "open" || patch.status === "pending"
          ? null
          : ticket.resolved_at,
  };
  return state.tickets[idx];
}

export function createSupportTicket(input: {
  customer_email: string;
  customer_name: string;
  subject: string;
  category: string;
  body: string;
  order_id?: string;
  priority?: SupportTicket["priority"];
}) {
  const id = `tkt-${Date.now()}`;
  const ticket: SupportTicket = {
    id,
    ticket_number: ticketNum(),
    customer_id: null,
    customer_email: input.customer_email,
    customer_name: input.customer_name,
    subject: input.subject,
    category: input.category,
    status: "open",
    priority: input.priority ?? "normal",
    assigned_to: null,
    order_id: input.order_id ?? null,
    last_reply_at: new Date().toISOString(),
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  state.tickets.unshift(ticket);
  state.ticketMessages[id] = [
    {
      id: `msg-${Date.now()}`,
      ticket_id: id,
      author_type: "customer",
      author_id: null,
      author_name: input.customer_name,
      body: input.body,
      is_internal: false,
      created_at: new Date().toISOString(),
    },
  ];
  return ticket;
}

export function getAnalytics() {
  return state.analytics;
}

export function recordPageVisit(path: string) {
  state.analytics.totalVisits += 1;
  state.analytics.pageViews += 1;
  const page = state.analytics.topPages.find((p) => p.path === path);
  if (page) page.views += 1;
  else state.analytics.topPages.push({ path, views: 1 });
  state.analytics.topPages.sort((a, b) => b.views - a.views);
  const today = new Date().toISOString().slice(0, 10);
  const day = state.analytics.dailyVisits.find((d) => d.date === today);
  if (day) day.visits += 1;
}

export function getExtendedConfig() {
  if (!state.config.couriers?.length) {
    state.config.couriers = COURIERS.map((c) => ({ ...c }));
  }
  return state.config;
}

export function updateExtendedConfig(patch: Partial<ExtendedPlatformConfig>) {
  state.config = mergeExtendedConfig({ ...state.config, ...patch });
  return state.config;
}

export function getStaffOverrides(id: string) {
  return state.staffOverrides[id] ?? null;
}

export function updateStaffAccess(id: string, patch: StaffAccessOverride) {
  state.staffOverrides[id] = { ...state.staffOverrides[id], ...patch };
  return state.staffOverrides[id];
}

export function removeStaffMemberDemo(id: string) {
  if (!state.deletedStaffIds.includes(id)) {
    state.deletedStaffIds.push(id);
  }
}

export function isStaffMemberDeleted(id: string) {
  return state.deletedStaffIds.includes(id);
}

export function addCourier(input: Omit<ConfigCourier, "id"> & { id?: string }) {
  const id =
    input.id ??
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");
  const courier: ConfigCourier = {
    id,
    name: input.name,
    baseCost: input.baseCost,
    etaLabel: input.etaLabel,
    regions: input.regions,
  };
  if (!state.config.couriers.find((c) => c.id === id)) {
    state.config.couriers.push(courier);
    state.config.enabledCourierIds.push(id);
  }
  return courier;
}

export function updateCourier(id: string, patch: Partial<ConfigCourier>) {
  const idx = state.config.couriers.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  state.config.couriers[idx] = { ...state.config.couriers[idx], ...patch };
  return state.config.couriers[idx];
}

export function removeCourier(id: string) {
  state.config.couriers = state.config.couriers.filter((c) => c.id !== id);
  state.config.enabledCourierIds = state.config.enabledCourierIds.filter((x) => x !== id);
  if (state.config.defaultCourierId === id) {
    state.config.defaultCourierId = state.config.enabledCourierIds[0] ?? "";
  }
}

export function listCheckoutOrders() {
  return state.checkoutOrders;
}

export function getCheckoutOrder(idOrNumber: string) {
  return (
    state.checkoutOrders.find(
      (o) => o.id === idOrNumber || orderNumbersMatch(o.orderNumber, idOrNumber),
    ) ?? null
  );
}

export function createCheckoutOrder(input: Omit<CheckoutOrderRecord, "id">) {
  const order: CheckoutOrderRecord = {
    ...input,
    id: `ord-live-${Date.now()}`,
  };
  state.checkoutOrders.unshift(order);
  const today = new Date().toISOString().slice(0, 10);
  const day = state.analytics.dailyVisits.find((d) => d.date === today);
  if (day) day.orders += 1;

  if (["paid", "sourcing", "purchased"].includes(order.status)) {
    ensureProcurementForOrder(order);
  }

  return order;
}

export function updateCheckoutOrder(
  id: string,
  patch: Partial<Pick<CheckoutOrderRecord, "status" | "carrier" | "trackingNumber">>,
) {
  const idx = state.checkoutOrders.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  state.checkoutOrders[idx] = { ...state.checkoutOrders[idx], ...patch };
  return state.checkoutOrders[idx];
}

export function listEmailSubscribers() {
  return state.emailSubscribers;
}

export function addEmailSubscriber(input: Omit<EmailSubscriber, "id" | "subscribedAt"> & { id?: string }) {
  const email = input.email.toLowerCase();
  const existing = state.emailSubscribers.find((s) => s.email === email);
  if (existing) {
    if (existing.status === "unsubscribed") {
      existing.status = "active";
      existing.subscribedAt = new Date().toISOString();
    }
    if (input.name && !existing.name) existing.name = input.name;
    return existing;
  }
  const subscriber: EmailSubscriber = {
    id: input.id ?? `sub-${Date.now()}`,
    email,
    name: input.name,
    source: input.source,
    status: input.status ?? "active",
    subscribedAt: new Date().toISOString(),
    tags: input.tags,
  };
  state.emailSubscribers.unshift(subscriber);
  return subscriber;
}

export function removeEmailSubscriber(id: string) {
  const idx = state.emailSubscribers.findIndex((s) => s.id === id);
  if (idx < 0) return false;
  state.emailSubscribers.splice(idx, 1);
  return true;
}

export function updateEmailSubscriber(id: string, patch: Partial<EmailSubscriber>) {
  const idx = state.emailSubscribers.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  state.emailSubscribers[idx] = { ...state.emailSubscribers[idx], ...patch };
  return state.emailSubscribers[idx];
}

export function listEmailBroadcasts() {
  return state.emailBroadcasts;
}

export function createEmailBroadcast(input: Omit<EmailBroadcast, "id" | "createdAt" | "recipientCount" | "status"> & { status?: EmailBroadcast["status"]; recipientCount?: number }) {
  const broadcast: EmailBroadcast = {
    ...input,
    id: `eml-${Date.now()}`,
    status: input.status ?? "draft",
    recipientCount: input.recipientCount ?? 0,
    createdAt: new Date().toISOString(),
  };
  state.emailBroadcasts.unshift(broadcast);
  return broadcast;
}

export function updateEmailBroadcast(id: string, patch: Partial<EmailBroadcast>) {
  const idx = state.emailBroadcasts.findIndex((b) => b.id === id);
  if (idx < 0) return null;
  state.emailBroadcasts[idx] = { ...state.emailBroadcasts[idx], ...patch };
  return state.emailBroadcasts[idx];
}
