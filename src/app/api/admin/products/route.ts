import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff } from "@/services/admin-service";
import { can } from "@/config/rbac";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";

const patchSchema = z.object({
  id: z.string().min(1),
  markup_percent: z.number().min(0).max(500).optional(),
  retail_price: z.number().min(0).optional(),
  is_featured: z.boolean().optional(),
  is_deal: z.boolean().optional(),
  stock_status: z
    .enum(["in_stock", "low_stock", "out_of_stock", "sourced"])
    .optional(),
});

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!can(staff.role, "products.edit") && !can(staff.role, "products.markup")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;

  // Demo mode: accept the change so the UI is exercisable without a backend.
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true, id, updates });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("staff_activity_log").insert({
      staff_id: staff.id,
      staff_name: staff.full_name,
      action: "Updated product pricing",
      entity_type: "product",
      entity_id: id,
      details: updates,
    });

    return NextResponse.json({ ok: true, product: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
