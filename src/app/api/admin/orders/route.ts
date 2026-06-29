import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { applyCheckoutOrderOperations } from "@/lib/orders/order-operations";
import { ensureProcurementForSupabaseOrder } from "@/lib/admin/operations-persistence";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

interface UpdateBody {
  id?: string;
  status?: string;
  carrier?: string;
  trackingNumber?: string;
}

const ALLOWED_STATUSES = new Set([
  "pending",
  "paid",
  "sourcing",
  "purchased",
  "shipped",
  "delivered",
  "cancelled",
]);

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "orders.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: UpdateBody;
  try {
    body = (await request.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }
  if (body.status && !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Persist to Supabase when connected; otherwise this is a demo no-op that
  // still confirms success so the admin UI behaves consistently.
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const update: OrderUpdate = {};
      if (body.status) update.status = body.status;
      if (body.carrier || body.trackingNumber) {
        update.metadata = {
          tracking: {
            carrier: body.carrier ?? null,
            trackingNumber: body.trackingNumber ?? null,
            updatedAt: new Date().toISOString(),
          },
        } satisfies Json;
      }
      if (Object.keys(update).length === 0) {
        return NextResponse.json({ ok: true });
      }
      const { error } = await supabase
        .from("orders")
        .update(update)
        .eq("id", body.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (body.status === "paid" || body.status === "sourcing") {
        await ensureProcurementForSupabaseOrder(body.id);
      }
    } catch {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
  }

  await applyCheckoutOrderOperations(body.id, {
    status: body.status,
    carrier: body.carrier,
    trackingNumber: body.trackingNumber,
  });

  return NextResponse.json({ ok: true });
}
