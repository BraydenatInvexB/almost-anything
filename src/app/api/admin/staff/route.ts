import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff } from "@/services/admin-service";
import { can } from "@/config/rbac";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";

const roleEnum = z.enum([
  "super_admin",
  "admin",
  "manager",
  "support_agent",
  "marketing",
  "fulfillment",
  "analyst",
]);

const createSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  role: roleEnum,
  department: z.string().optional(),
  title: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  role: roleEnum.optional(),
  status: z.enum(["invited", "active", "suspended"]).optional(),
});

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(staff.role, "staff.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true, staff: parsed.data });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("staff_members")
      .insert({ ...parsed.data, status: "invited", created_by: staff.id })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("staff_activity_log").insert({
      staff_id: staff.id,
      staff_name: staff.full_name,
      action: "Invited new staff member",
      entity_type: "staff",
      entity_id: data.id,
      details: { role: parsed.data.role },
    });

    return NextResponse.json({ ok: true, staff: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(staff.role, "staff.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true, id, updates });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("staff_members")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("staff_activity_log").insert({
      staff_id: staff.id,
      staff_name: staff.full_name,
      action: "Updated staff member",
      entity_type: "staff",
      entity_id: id,
      details: updates,
    });

    return NextResponse.json({ ok: true, staff: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
