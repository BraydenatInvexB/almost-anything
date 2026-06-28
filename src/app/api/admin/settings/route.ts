import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff } from "@/services/admin-service";
import { can } from "@/config/rbac";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";

const schema = z.object({
  store_name: z.string().min(1).optional(),
  support_email: z.string().email().optional(),
  default_markup_percent: z.number().min(0).max(500).optional(),
  min_markup_percent: z.number().min(0).max(500).optional(),
  max_markup_percent: z.number().min(0).max(500).optional(),
  free_shipping_threshold: z.number().min(0).optional(),
  flat_shipping_fee: z.number().min(0).optional(),
  tax_rate: z.number().min(0).max(1).optional(),
  auto_publish_sourced: z.boolean().optional(),
  maintenance_mode: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(staff.role, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true, settings: parsed.data });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .update({ ...parsed.data, updated_by: staff.id, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("staff_activity_log").insert({
      staff_id: staff.id,
      staff_name: staff.full_name,
      action: "Updated platform settings",
      entity_type: "settings",
      entity_id: "1",
      details: parsed.data,
    });

    return NextResponse.json({ ok: true, settings: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
