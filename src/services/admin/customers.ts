import { createClient } from "@/lib/supabase/server";
import { DEMO_CUSTOMERS, type DemoCustomer } from "@/lib/admin/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { AdminOrderSummary } from "./types";
import { listAdminOrders } from "./orders";

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
