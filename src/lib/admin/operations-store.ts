import { SEED_PRODUCTS } from "@/lib/data/seed-products";
import { COURIERS } from "@/config/couriers";
import type { Permission } from "@/config/rbac";
import type { StaffRole, StaffStatus } from "@/types/database";
import { DEMO_TICKETS, DEMO_TICKET_MESSAGES } from "@/lib/admin/demo-data";
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
  procurement: ProcurementRecord[];
  inventory: InventoryRecord[];
  customProducts: AdminProductDraft[];
  checkoutOrders: CheckoutOrderRecord[];
  payables: import("@/lib/admin/finance-types").SupplierPayable[];
  staffOverrides: Record<string, StaffAccessOverride>;
  tickets: SupportTicket[];
  ticketMessages: Record<string, TicketMessage[]>;
  analytics: SiteAnalytics;
  config: ExtendedPlatformConfig;
}

const initial: OperationsState = {
  config: {
    embedShippingInPrice: true,
    defaultCourierId: "aramex",
    enabledCourierIds: ["courier_guy", "fastway", "aramex"],
    currency: "ZAR",
    couriers: COURIERS.map((c) => ({ ...c })),
  },
  staffOverrides: {
    "stf-004": { denied_permissions: ["finance.view", "finance.manage", "hr.view", "hr.manage"] },
    "stf-009": { denied_permissions: ["support.view", "support.manage", "hr.view", "hr.manage"] },
    "stf-010": { denied_permissions: ["support.view", "support.manage", "finance.view", "finance.manage"] },
  },
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
      label: "Refund AA-83915",
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
      orderNumber: "AA-83920",
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
      orderNumber: "AA-83919",
      procurementId: "proc-002",
      createdAt: iso(6),
      paidAt: iso(3),
    },
  ],
  returns: [
    {
      id: "ret-001",
      orderId: "ord-1005",
      orderNumber: "AA-83915",
      customerName: "Marcus Bennett",
      customerEmail: "marcus.bennett@gmail.com",
      reason: "Damaged lamp shade on arrival",
      status: "approved",
      refundAmount: 890,
      currency: "ZAR",
      createdAt: iso(3),
    },
    {
      id: "ret-002",
      orderId: "ord-1008",
      orderNumber: "AA-83912",
      customerName: "Olivia Hughes",
      customerEmail: "olivia.h@proton.me",
      reason: "Wrong size sofa ordered",
      status: "requested",
      refundAmount: 0,
      currency: "ZAR",
      createdAt: iso(1),
    },
  ],
  procurement: [
    {
      id: "proc-001",
      orderId: "ord-1001",
      orderNumber: "AA-83920",
      productName: "Long Chair",
      supplier: "Nordic Home Supply",
      supplierCountry: "Netherlands",
      costPrice: 4200,
      sellPrice: 8999,
      currency: "ZAR",
      status: "in_transit",
      origin: "overseas",
      orderedAt: iso(4),
      expectedAt: iso(-3),
    },
    {
      id: "proc-002",
      orderId: "ord-1002",
      orderNumber: "AA-83919",
      productName: "Arc Floor Lamp",
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

export function updateReturn(id: string, patch: Partial<ReturnRequest>) {
  const idx = state.returns.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  state.returns[idx] = { ...state.returns[idx], ...patch };
  return state.returns[idx];
}

export function listProcurement() {
  return state.procurement;
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
  state.customProducts[idx] = {
    ...state.customProducts[idx],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  return state.customProducts[idx];
}

export function listOpsTickets() {
  return state.tickets;
}

export function getOpsTicketMessages(ticketId: string) {
  return state.ticketMessages[ticketId] ?? [];
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
  state.config = { ...state.config, ...patch };
  return state.config;
}

export function getStaffOverrides(id: string) {
  return state.staffOverrides[id] ?? null;
}

export function updateStaffAccess(id: string, patch: StaffAccessOverride) {
  state.staffOverrides[id] = { ...state.staffOverrides[id], ...patch };
  return state.staffOverrides[id];
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
      (o) => o.id === idOrNumber || o.orderNumber === idOrNumber,
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
