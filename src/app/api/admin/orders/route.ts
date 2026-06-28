import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/services/admin-service";
import { can } from "@/config/rbac";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
  if (!staff || !can(staff.role, "orders.manage")) {
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
      const update: Record<string, unknown> = {};
      if (body.status) update.status = body.status;
      if (body.carrier || body.trackingNumber) {
        update.tracking = {
          carrier: body.carrier ?? null,
          trackingNumber: body.trackingNumber ?? null,
          updatedAt: new Date().toISOString(),
        };
      }
      const { error } = await supabase
        .from("orders")
        .update(update)
        .eq("id", body.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } catch {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
