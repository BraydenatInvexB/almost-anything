import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff, saveStaffAccess } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import type { Permission } from "@/config/rbac";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { toStaffProfile } from "@/lib/staff/profile";
import type { StaffMember } from "@/types/database";

const roleEnum = z.enum([
  "super_admin",
  "admin",
  "manager",
  "finance",
  "hr",
  "support_agent",
  "marketing",
  "fulfillment",
  "analyst",
]);

const permissionEnum = z.enum([
  "dashboard.view",
  "products.view",
  "products.edit",
  "products.markup",
  "orders.view",
  "orders.manage",
  "customers.view",
  "customers.manage",
  "customers.reset_password",
  "staff.view",
  "staff.manage",
  "support.view",
  "support.manage",
  "marketing.view",
  "marketing.manage",
  "finance.view",
  "finance.manage",
  "inventory.view",
  "inventory.manage",
  "returns.view",
  "returns.manage",
  "procurement.view",
  "procurement.manage",
  "analytics.view",
  "hr.view",
  "hr.manage",
  "settings.view",
  "settings.manage",
  "activity.view",
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
  extra_permissions: z.array(permissionEnum).optional(),
  denied_permissions: z.array(permissionEnum).optional(),
});

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!staffCan(staff, "staff.manage")) {
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
      .insert({
        ...parsed.data,
        status: "invited",
        created_by: staff.id,
        extra_permissions: [],
        denied_permissions: [],
      })
      .select("*")
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

    return NextResponse.json({
      ok: true,
      staff: toStaffProfile(data as StaffMember & Record<string, unknown>),
    });
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
  if (!staffCan(staff, "staff.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { id, extra_permissions, denied_permissions, ...updates } = parsed.data;

  const updated = await saveStaffAccess(id, {
    ...updates,
    extra_permissions: extra_permissions as Permission[] | undefined,
    denied_permissions: denied_permissions as Permission[] | undefined,
  });

  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createServiceClient();
      await supabase.from("staff_activity_log").insert({
        staff_id: staff.id,
        staff_name: staff.full_name,
        action: "Updated staff member access",
        entity_type: "staff",
        entity_id: id,
        details: parsed.data,
      });
    } catch {
      /* non-fatal */
    }
  }

  return NextResponse.json({ ok: true, staff: updated, demo: !isSupabaseConfigured() });
}
