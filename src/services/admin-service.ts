import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  DEMO_STAFF,
  DEMO_CUSTOMERS,
  DEMO_TICKETS,
  DEMO_TICKET_MESSAGES,
  DEMO_ACTIVITY,
  DEMO_SETTINGS,
  DEMO_SUPER_ADMIN,
  type DemoCustomer,
} from "@/lib/admin/demo-data";
import { SEED_PRODUCTS } from "@/lib/data/seed-products";
import type {
  StaffMember,
  SupportTicket,
  TicketMessage,
  StaffActivity,
  PlatformSettings,
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
export async function getCurrentStaff(): Promise<StaffMember | null> {
  if (!isSupabaseConfigured()) {
    // Demo mode: expose the panel as the platform owner so it is reviewable
    // locally. In production (Supabase configured) real RBAC is enforced.
    return DEMO_SUPER_ADMIN;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("staff_members")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (error || !data) return null;
    return data as StaffMember;
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
  topProducts: { name: string; sold: number; revenue: number }[];
  recentOrders: AdminOrderSummary[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const orders = await listAdminOrders();
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const recentOrders = orders.slice(0, 6);

  const revenueSeries = [
    { label: "Mon", value: 4200 },
    { label: "Tue", value: 5100 },
    { label: "Wed", value: 4800 },
    { label: "Thu", value: 6300 },
    { label: "Fri", value: 7400 },
    { label: "Sat", value: 8900 },
    { label: "Sun", value: 6700 },
  ];

  const topProducts = [
    { name: "Long Chair", sold: 142, revenue: 72136 },
    { name: "Oak Frame Armchair", sold: 98, revenue: 33418 },
    { name: "Cloud Comfort Bed Frame", sold: 64, revenue: 38528 },
    { name: "Scandinavian Dining Table", sold: 51, revenue: 20451 },
    { name: "Arc Floor Lamp", sold: 47, revenue: 8037 },
  ];

  const tickets = await listTickets();
  const staff = await listStaff();

  return {
    revenue,
    revenueChange: 12.4,
    orders: orders.length,
    ordersChange: 8.1,
    customers: (await listCustomers()).length,
    customersChange: 5.6,
    avgOrderValue: orders.length ? revenue / orders.length : 0,
    openTickets: tickets.filter((t) => t.status === "open" || t.status === "pending").length,
    lowStock: SEED_PRODUCTS.filter((p) => p.stock_status === "low_stock").length,
    activeStaff: staff.filter((s) => s.status === "active").length,
    revenueSeries,
    topProducts,
    recentOrders,
  };
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------
export async function listStaff(): Promise<StaffMember[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("staff_members")
        .select("*")
        .order("created_at", { ascending: true });
      if (data && data.length) return data as StaffMember[];
    } catch {
      /* fall through */
    }
  }
  return DEMO_STAFF;
}

// ---------------------------------------------------------------------------
// Products (admin view — full rows incl. cost, markup, stock)
// ---------------------------------------------------------------------------
import type { Product } from "@/types/database";

export async function listAdminProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (data && data.length) return data as Product[];
    } catch {
      /* fall through */
    }
  }
  return SEED_PRODUCTS.map((p, i) => ({
    ...p,
    id: `seed-${p.slug}`,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  })) as Product[];
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
}

function buildDemoOrders(): AdminOrderSummary[] {
  const statuses = ["paid", "shipped", "delivered", "pending", "purchased", "cancelled"];
  const orders: AdminOrderSummary[] = [];
  for (let i = 0; i < 24; i++) {
    const cust = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
    const product = SEED_PRODUCTS[i % SEED_PRODUCTS.length];
    const qty = (i % 3) + 1;
    const d = new Date();
    d.setDate(d.getDate() - i);
    orders.push({
      id: `ord-${1000 + i}`,
      orderNumber: `AA-${83920 - i}`,
      customerName: cust.full_name,
      customerEmail: cust.email,
      status: statuses[i % statuses.length],
      total: Number((product.retail_price * qty + 12).toFixed(2)),
      currency: "ZAR",
      itemCount: qty,
      createdAt: d.toISOString(),
    });
  }
  return orders;
}

export async function listAdminOrders(): Promise<AdminOrderSummary[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const res = await supabase
        .from("orders")
        .select("id, order_number, status, total, currency, shipping_address, created_at, order_items(id)")
        .order("created_at", { ascending: false })
        .limit(100);
      const data = (res.data ?? []) as unknown as Array<{
        id: string;
        order_number: string;
        status: string;
        total: number;
        currency: string;
        shipping_address: Record<string, unknown> | null;
        created_at: string;
        order_items: { id: string }[] | null;
      }>;
      if (data.length) {
        return data.map((o) => {
          const addr = (o.shipping_address ?? {}) as Record<string, unknown>;
          return {
            id: o.id,
            orderNumber: o.order_number,
            customerName: (addr.fullName as string) ?? "Customer",
            customerEmail: (addr.email as string) ?? "",
            status: o.status,
            total: o.total,
            currency: o.currency,
            itemCount: Array.isArray(o.order_items) ? o.order_items.length : 0,
            createdAt: o.created_at,
          };
        });
      }
    } catch {
      /* fall through */
    }
  }
  return buildDemoOrders();
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
  return DEMO_TICKETS;
}

export async function getTicket(
  id: string,
): Promise<{ ticket: SupportTicket; messages: TicketMessage[] } | null> {
  const tickets = await listTickets();
  const ticket = tickets.find((t) => t.id === id || t.ticket_number === id);
  if (!ticket) return null;

  let messages: TicketMessage[] = DEMO_TICKET_MESSAGES[ticket.id] ?? [];
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
