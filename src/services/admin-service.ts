import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  DEMO_STAFF,
  DEMO_CUSTOMERS,
  DEMO_ACTIVITY,
  DEMO_SETTINGS,
  DEMO_SUPER_ADMIN,
  type DemoCustomer,
} from "@/lib/admin/demo-data";
import {
  getExtendedConfig,
  getOpsTicketMessages,
  getStaffOverrides,
  listCustomProducts,
  listCheckoutOrders,
  getCheckoutOrder,
  listOpsTickets,
  updateExtendedConfig,
  updateStaffAccess,
} from "@/lib/admin/operations-store";
import {
  ensureProcurementForOrder,
  ensureProcurementForSupabaseOrder,
  listProcurementByOrder,
  listProcurement,
  listInventory,
  listReturns,
  listExpenses,
  listPayables,
  listCampaigns,
  getAnalytics,
} from "@/lib/admin/operations-persistence";
import { QUEUE_STATUSES } from "@/lib/orders/order-operations";
import { parseOrderItemMetadata } from "@/lib/orders/line-items";
import { resolveFulfillment, type FulfillmentSource } from "@/lib/orders/fulfillment";
import { getAllCouriers } from "@/config/couriers";
import { staffCan } from "@/config/rbac";
import type { AdminNotificationItem, AdminNotificationSummary } from "@/lib/admin/notifications";
import { notificationTotal } from "@/lib/admin/notifications";
import { toStaffProfile } from "@/lib/staff/profile";
import { countOpenItemRequests } from "@/services/sourcing-request-service";
import { mergeExtendedConfig } from "@/lib/admin/extended-config-defaults";
import type { ExtendedPlatformConfig } from "@/lib/admin/operations-types";
import { createServiceClient } from "@/lib/supabase/admin";
import type { StaffProfile } from "@/types/staff-access";
import { SEED_PRODUCTS } from "@/lib/data/seed-products";
import { buildFinanceSummary } from "@/lib/admin/finance-summary";
import type { FinanceDashboardData } from "@/lib/admin/finance-types";
import type {
  StaffMember,
  SupportTicket,
  TicketMessage,
  StaffActivity,
  PlatformSettings,
  Product,
} from "@/types/database";

/**
 * Admin data access layer. Every function reads from Supabase when configured
 * and otherwise returns rich demo data, so the admin panel is fully explorable
 * in local development and degrades gracefully in production outages.
 */

export function isAdminLiveMode(): boolean {
  return isSupabaseConfigured();
}

// ---------------------------------------------------------------------------
// Session / current staff
// ---------------------------------------------------------------------------
async function activateStaffOnLogin(
  service: ReturnType<typeof createServiceClient>,
  row: StaffMember,
  userId: string,
): Promise<StaffMember> {
  const patch: {
    user_id: string;
    last_active_at: string;
    status?: StaffMember["status"];
  } = {
    user_id: userId,
    last_active_at: new Date().toISOString(),
  };
  if (row.status === "invited") {
    patch.status = "active";
  }

  const { data: updated, error } = await service
    .from("staff_members")
    .update(patch)
    .eq("id", row.id)
    .select("*")
    .single();

  if (!error && updated) return updated as StaffMember;
  return { ...row, user_id: userId, status: row.status === "invited" ? "active" : row.status } as StaffMember;
}

async function resolveLiveStaffUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): Promise<StaffMember | null> {
  const service = createServiceClient();

  const { data: byUser } = await service
    .from("staff_members")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (byUser) {
    if (byUser.status === "suspended") return null;
    return activateStaffOnLogin(service, byUser as StaffMember, user.id);
  }

  const email = user.email?.trim().toLowerCase();
  if (!email) return null;

  const { data: byEmail } = await service
    .from("staff_members")
    .select("*")
    .ilike("email", email)
    .in("status", ["active", "invited"])
    .maybeSingle();

  if (byEmail) {
    return activateStaffOnLogin(service, byEmail as StaffMember, user.id);
  }

  const { count } = await service
    .from("staff_members")
    .select("*", { count: "exact", head: true });

  if ((count ?? 0) === 0) {
    const fullName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : email.split("@")[0];

    const { data: created, error } = await service
      .from("staff_members")
      .insert({
        user_id: user.id,
        email,
        full_name: fullName,
        role: "super_admin",
        status: "active",
        extra_permissions: [],
        denied_permissions: [],
      })
      .select("*")
      .single();

    if (!error && created) return created as StaffMember;
  }

  return null;
}

export async function getCurrentStaff(): Promise<StaffProfile | null> {
  if (!isSupabaseConfigured()) {
    return getStaffProfile(DEMO_SUPER_ADMIN.id);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const staff = await resolveLiveStaffUser(user);
    if (!staff) return null;
    return toStaffProfile(staff as StaffMember & Record<string, unknown>);
  } catch {
    return null;
  }
}

export function getStaffProfile(id: string): StaffProfile | null {
  const base = DEMO_STAFF.find((s) => s.id === id);
  if (!base) return null;
  const override = getStaffOverrides(id);
  return toStaffProfile({
    ...base,
    ...override,
    extra_permissions: override?.extra_permissions ?? [],
    denied_permissions: override?.denied_permissions ?? [],
  } as StaffMember & Record<string, unknown>);
}

export async function saveStaffAccess(
  id: string,
  patch: {
    role?: StaffProfile["role"];
    status?: StaffProfile["status"];
    extra_permissions?: StaffProfile["extra_permissions"];
    denied_permissions?: StaffProfile["denied_permissions"];
  },
): Promise<StaffProfile | null> {
  if (!isSupabaseConfigured()) {
    updateStaffAccess(id, patch);
    return getStaffProfile(id);
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("staff_members")
      .update({
        ...patch,
        extra_permissions: patch.extra_permissions ?? undefined,
        denied_permissions: patch.denied_permissions ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) return null;
    return toStaffProfile(data as StaffMember & Record<string, unknown>);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------
export interface DashboardStats {
  revenue: number;
  revenueChange: number;
  orders: number;
  ordersChange: number;
  customers: number;
  customersChange: number;
  avgOrderValue: number;
  openTickets: number;
  lowStock: number;
  activeStaff: number;
  revenueSeries: { label: string; value: number }[];
  topProducts: { name: string; sold: number; revenue: number; category?: string }[];
  topCategories: { name: string; sold: number; revenue: number }[];
  recentOrders: AdminOrderSummary[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const orders = await listAdminOrders();
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);
  const recentOrders = orders.slice(0, 8);

  const revenueSeries = buildWeeklyRevenueSeries(orders);
  const topProducts = buildTopProductsFromOrders(orders);
  const topCategories = buildTopCategories(topProducts);

  const tickets = await listTickets();
  const staff = await listStaff();
  const customers = await listCustomers();

  const priorOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const mid = new Date();
    mid.setDate(mid.getDate() - 7);
    return d >= cutoff && d < mid;
  });
  const recentWeekOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    const mid = new Date();
    mid.setDate(mid.getDate() - 7);
    return d >= mid;
  });

  const priorRevenue = priorOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);
  const recentRevenue = recentWeekOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);

  const priorCustomers = customers.filter((c) => {
    const d = new Date(c.created_at);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const mid = new Date();
    mid.setDate(mid.getDate() - 7);
    return d >= cutoff && d < mid;
  });
  const recentCustomers = customers.filter((c) => {
    const d = new Date(c.created_at);
    const mid = new Date();
    mid.setDate(mid.getDate() - 7);
    return d >= mid;
  });

  return {
    revenue,
    revenueChange: pctChange(priorRevenue, recentRevenue),
    orders: orders.length,
    ordersChange: pctChange(priorOrders.length, recentWeekOrders.length),
    customers: customers.length,
    customersChange: pctChange(priorCustomers.length, recentCustomers.length),
    avgOrderValue: orders.length ? revenue / orders.length : 0,
    openTickets: tickets.filter((t) => t.status === "open" || t.status === "pending").length,
    lowStock: (await listAdminProducts()).filter(
      (p) => p.stock_status === "low_stock" || p.stock_status === "out_of_stock",
    ).length,
    activeStaff: staff.filter((s) => s.status === "active").length,
    revenueSeries,
    topProducts,
    topCategories,
    recentOrders,
  };
}

function pctChange(prior: number, current: number): number {
  if (prior === 0) return current > 0 ? 100 : 0;
  return Number((((current - prior) / prior) * 100).toFixed(1));
}

function buildWeeklyRevenueSeries(orders: AdminOrderSummary[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets = days.map((label) => ({ label, value: 0 }));
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const d = new Date(o.createdAt);
    if (d < weekAgo) continue;
    buckets[d.getDay()].value += o.total;
  }

  const rotated = [...buckets.slice(1), buckets[0]];
  return rotated;
}

function buildTopProductsFromOrders(orders: AdminOrderSummary[]) {
  const counts = new Map<
    string,
    { name: string; sold: number; revenue: number; category?: string }
  >();

  for (const live of listCheckoutOrders()) {
    for (const item of live.lineItems) {
      const cur = counts.get(item.name) ?? { name: item.name, sold: 0, revenue: 0 };
      cur.sold += item.quantity;
      cur.revenue += item.unitPrice * item.quantity;
      const seed = SEED_PRODUCTS.find((p) => p.name === item.name);
      if (seed) cur.category = seed.category;
      counts.set(item.name, cur);
    }
  }

  for (const o of orders) {
    if (o.id.startsWith("ord-live-")) continue;
    const unit = o.itemCount > 0 ? (o.total * 0.88) / o.itemCount : o.total;
    for (let i = 0; i < Math.max(1, o.itemCount); i++) {
      const p = SEED_PRODUCTS[i % SEED_PRODUCTS.length];
      const cur = counts.get(p.name) ?? {
        name: p.name,
        sold: 0,
        revenue: 0,
        category: p.category,
      };
      cur.sold += 1;
      cur.revenue += unit;
      counts.set(p.name, cur);
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
}

function buildTopCategories(
  products: { name: string; sold: number; revenue: number; category?: string }[],
) {
  const cats = new Map<string, { name: string; sold: number; revenue: number }>();
  for (const p of products) {
    const slug = p.category ?? "general";
    const label = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const cur = cats.get(slug) ?? { name: label, sold: 0, revenue: 0 };
    cur.sold += p.sold;
    cur.revenue += p.revenue;
    cats.set(slug, cur);
  }
  return [...cats.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------
export async function listStaff(): Promise<StaffProfile[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const res = await supabase
        .from("staff_members")
        .select("*")
        .order("created_at", { ascending: true });
      if (!res.error) {
        return ((res.data ?? []) as StaffMember[]).map((row) =>
          toStaffProfile(row as StaffMember & Record<string, unknown>),
        );
      }
    } catch {
      /* fall through */
    }
  }
  return DEMO_STAFF.map((s) => getStaffProfile(s.id)!);
}

// ---------------------------------------------------------------------------
// Products (admin view — full rows incl. cost, markup, stock)
// ---------------------------------------------------------------------------
export async function listAdminProducts(): Promise<Product[]> {
  const custom = listCustomProducts().map(
    (p) =>
      ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        category: p.category as Product["category"],
        base_price: p.base_price,
        retail_price: p.retail_price,
        markup_percent: p.markup_percent,
        currency: p.currency,
        rating: 0,
        review_count: 0,
        stock_status: p.stock_status,
        image_url: p.image_url,
        enhanced_image_url: p.image_url,
        source_url: null,
        source_name: p.source_name,
        delivery_days_min: p.delivery_days_min,
        delivery_days_max: p.delivery_days_max,
        is_featured: p.is_featured,
        is_exclusive: false,
        is_deal: p.is_deal,
        deal_discount_percent: p.deal_discount_percent,
        show_in_hot: p.show_in_hot ?? false,
        show_in_steals: p.show_in_steals ?? false,
        show_in_fresh_drops: p.show_in_fresh_drops ?? false,
        metadata: { stock_origin: p.stock_origin, quantity: p.quantity },
        created_at: p.created_at,
        updated_at: p.updated_at,
      }) as Product,
  );

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (data && data.length) return [...(data as Product[]), ...custom];
    } catch {
      /* fall through */
    }
  }
  return [
    ...SEED_PRODUCTS.map((p, i) => ({
      ...p,
      id: `seed-${p.slug}`,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    })) as Product[],
    ...custom,
  ];
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  const products = await listAdminProducts();
  return products.find((p) => p.id === id || p.slug === id) ?? null;
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
export async function listCustomers(): Promise<DemoCustomer[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const res = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, created_at")
        .order("created_at", { ascending: false });
      const data = (res.data ?? []) as unknown as Array<{
        id: string;
        full_name: string | null;
        email: string | null;
        phone: string | null;
        avatar_url: string | null;
        created_at: string;
      }>;
      if (data.length) {
        return data.map((p) => ({
          id: p.id,
          full_name: p.full_name ?? "Customer",
          email: p.email ?? "",
          phone: p.phone,
          avatar_url: p.avatar_url,
          created_at: p.created_at,
          orders_count: 0,
          total_spent: 0,
          status: "active" as const,
          last_order_at: null,
        }));
      }
    } catch {
      /* fall through */
    }
  }
  return DEMO_CUSTOMERS;
}

export async function getCustomer(id: string): Promise<DemoCustomer | null> {
  const customers = await listCustomers();
  return customers.find((c) => c.id === id) ?? null;
}

export async function getCustomerOrders(customerEmail: string): Promise<AdminOrderSummary[]> {
  const orders = await listAdminOrders();
  return orders.filter((o) => o.customerEmail.toLowerCase() === customerEmail.toLowerCase());
}

export interface AdminOrderLineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  sku?: string;
  variantId?: string;
  variantLabel?: string;
  selectedOptions?: Record<string, string>;
  productId?: string;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  customerId?: string;
  shippingAddress: {
    fullName: string;
    email: string;
    phone?: string;
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  lineItems: AdminOrderLineItem[];
  subtotal: number;
  shippingCost: number;
  shippingInternalCost?: number;
  tax: number;
  carrier?: string;
  trackingNumber?: string;
  courierId?: string;
  courierName?: string;
  timeline: { label: string; at: string; note?: string }[];
  paymentMethod: string;
  stockOrigin?: "sa_warehouse" | "overseas";
}

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

export async function getFulfillmentQueue(): Promise<AdminOrderSummary[]> {
  const orders = await listAdminOrders();
  return orders.filter((o) => QUEUE_STATUSES.includes(o.status as (typeof QUEUE_STATUSES)[number]));
}

export async function getAdminNotificationSummary(
  staff: StaffProfile,
): Promise<AdminNotificationSummary> {
  const items: AdminNotificationItem[] = [];

  if (staffCan(staff, "orders.view")) {
    const fulfillment = await getFulfillmentQueue();
    if (fulfillment.length > 0) {
      items.push({
        id: "fulfillment",
        title: "Fulfillment",
        description: `${fulfillment.length} order${fulfillment.length === 1 ? "" : "s"} to process or ship`,
        href: "/admin/fulfillment",
        count: fulfillment.length,
      });
    }
  }

  if (staffCan(staff, "procurement.view")) {
    const requests = await countOpenItemRequests();
    if (requests > 0) {
      items.push({
        id: "requests",
        title: "Item requests",
        description: `${requests} custom product lookup${requests === 1 ? "" : "s"}`,
        href: "/admin/requests",
        count: requests,
      });
    }
  }

  if (staffCan(staff, "support.view")) {
    const tickets = await listTickets();
    const open = tickets.filter((t) => t.status === "open" || t.status === "pending");
    if (open.length > 0) {
      items.push({
        id: "support",
        title: "Support",
        description: `${open.length} ticket${open.length === 1 ? "" : "s"} awaiting reply`,
        href: "/admin/support",
        count: open.length,
      });
    }
  }

  if (staffCan(staff, "products.view")) {
    const lowStock = (await listAdminProducts()).filter(
      (p) => p.stock_status === "low_stock" || p.stock_status === "out_of_stock",
    ).length;
    if (lowStock > 0) {
      items.push({
        id: "stock",
        title: "Stock alerts",
        description: `${lowStock} product${lowStock === 1 ? "" : "s"} low or out of stock`,
        href: "/admin/products",
        count: lowStock,
      });
    }
  }

  items.sort((a, b) => b.count - a.count);

  return {
    total: notificationTotal(items),
    items,
  };
}

export async function getOrderProcurement(orderId: string, orderNumber: string) {
  return listProcurementByOrder(orderId, orderNumber);
}

export interface ReportsSummary {
  revenueByStatus: { status: string; count: number; total: number }[];
  ordersByDay: { label: string; count: number }[];
  supportMetrics: { open: number; urgent: number; avgResponseHrs: number };
  catalogHealth: {
    inStock: number;
    availableInternational: number;
    lowStock: number;
    outOfStock: number;
  };
  fulfillmentBacklog: number;
}

export async function getReportsSummary(): Promise<ReportsSummary> {
  const orders = await listAdminOrders();
  const products = await listAdminProducts();
  const tickets = await listTickets();

  const statuses = ["pending", "paid", "sourcing", "purchased", "shipped", "delivered", "cancelled"];
  const revenueByStatus = statuses.map((status) => {
    const matched = orders.filter((o) => o.status === status);
    return {
      status,
      count: matched.length,
      total: matched.reduce((s, o) => s + o.total, 0),
    };
  });

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const ordersByDay = days.map((label, i) => ({
    label,
    count: orders.filter((_, idx) => idx % 7 === i).length,
  }));

  return {
    revenueByStatus,
    ordersByDay,
    supportMetrics: {
      open: tickets.filter((t) => t.status === "open" || t.status === "pending").length,
      urgent: tickets.filter((t) => t.priority === "urgent").length,
      avgResponseHrs: 4.2,
    },
    catalogHealth: {
      inStock: products.filter((p) => p.stock_status === "in_stock").length,
      availableInternational: products.filter((p) => p.stock_status === "available_international").length,
      lowStock: products.filter((p) => p.stock_status === "low_stock").length,
      outOfStock: products.filter((p) => p.stock_status === "out_of_stock").length,
    },
    fulfillmentBacklog: orders.filter((o) => o.status === "paid" || o.status === "purchased").length,
  };
}

// ---------------------------------------------------------------------------
// Orders (admin view)
// ---------------------------------------------------------------------------
export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: string;
  paymentMethod?: string;
  courierName?: string;
  stockOrigin?: "sa_warehouse" | "overseas";
  shippingCountry?: string;
  fulfillmentSource?: FulfillmentSource;
  fulfillmentLabel?: string;
}

function enrichOrderSummary(o: AdminOrderSummary): AdminOrderSummary {
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
        const live = listCheckoutOrders()
          .map((o) => checkoutToSummary(o)!)
          .filter((o) => !fromDb.some((d) => d.orderNumber === o.orderNumber));
        return [...fromDb, ...live].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }
    } catch {
      /* fall through */
    }
  }
  const live = listCheckoutOrders().map((o) => checkoutToSummary(o)!);
  return [...live, ...buildDemoOrders()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

// ---------------------------------------------------------------------------
// Support tickets
// ---------------------------------------------------------------------------
export async function listTickets(): Promise<SupportTicket[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (data && data.length) return data as SupportTicket[];
    } catch {
      /* fall through */
    }
  }
  return listOpsTickets();
}

export async function getTicket(
  id: string,
): Promise<{ ticket: SupportTicket; messages: TicketMessage[] } | null> {
  const tickets = await listTickets();
  const ticket = tickets.find((t) => t.id === id || t.ticket_number === id);
  if (!ticket) return null;

  let messages: TicketMessage[] = getOpsTicketMessages(ticket.id);
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      if (data) messages = data as TicketMessage[];
    } catch {
      /* fall through */
    }
  }
  return { ticket, messages };
}

export async function getFinanceDashboard(): Promise<FinanceDashboardData> {
  const [orders, settings, expenses, returns, procurement, payables] = await Promise.all([
    listAdminOrders(),
    getSettings(),
    listExpenses(),
    listReturns(),
    listProcurement(),
    listPayables(),
  ]);
  const checkoutOrders = listCheckoutOrders();

  const summary = buildFinanceSummary({
    orders,
    checkoutOrders,
    expenses,
    returns,
    procurement,
    payables,
    taxRate: Number(settings.tax_rate) || 0.15,
    currency: settings.currency ?? "ZAR",
  });

  return {
    summary,
    expenses,
    payables,
    returns,
    recentOrders: orders.slice(0, 20).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      total: o.total,
      paymentMethod: o.paymentMethod,
      status: o.status,
      createdAt: o.createdAt,
    })),
  };
}

export {
  listCampaigns,
  listExpenses,
  listPayables,
  listReturns,
  listProcurement,
  listInventory,
  getAnalytics,
  getExtendedConfig,
  updateExtendedConfig,
} from "@/lib/admin/operations-persistence";

export async function getPlatformExtendedConfig(): Promise<ExtendedPlatformConfig> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("platform_settings")
        .select("extended_config")
        .eq("id", 1)
        .maybeSingle();
      if (data?.extended_config) {
        return mergeExtendedConfig(
          data.extended_config as Partial<ExtendedPlatformConfig>,
        );
      }
    } catch {
      /* fall through */
    }
  }
  return mergeExtendedConfig(getExtendedConfig());
}

export async function listAdminCouriers(): Promise<{ id: string; name: string }[]> {
  const config = await getPlatformExtendedConfig();
  return getAllCouriers(config).map((c) => ({ id: c.id, name: c.name }));
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export async function getSettings(): Promise<PlatformSettings> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (data) return data as PlatformSettings;
    } catch {
      /* fall through */
    }
  }
  return DEMO_SETTINGS;
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------
export async function listActivity(): Promise<StaffActivity[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("staff_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (data && data.length) return data as StaffActivity[];
    } catch {
      /* fall through */
    }
  }
  return DEMO_ACTIVITY;
}
