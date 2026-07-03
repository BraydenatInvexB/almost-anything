import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff, saveStaffAccess } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import type { Permission } from "@/config/rbac";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { toStaffProfile } from "@/lib/staff/profile";
import { provisionStaffAuthUser } from "@/lib/staff/invite-auth";
import type { StaffMember } from "@/types/database";
import type { Json } from "@/types/database";

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
    const email = parsed.data.email.trim().toLowerCase();
    const title = parsed.data.title?.trim() || null;

    const { data: existing } = await supabase
      .from("staff_members")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (existing && existing.status !== "invited") {
      return NextResponse.json({ error: "A staff member with this email already exists" }, { status: 409 });
    }

    const auth = await provisionStaffAuthUser(supabase, email, parsed.data.full_name, {
      resend: Boolean(existing),
      request,
    });
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: 500 });
    }

    const row = {
      email,
      full_name: parsed.data.full_name,
      role: parsed.data.role,
      department: parsed.data.department ?? title,
      title,
      status: auth.emailSent ? ("invited" as const) : ("active" as const),
      user_id: auth.userId,
      created_by: staff.id,
      extra_permissions: [] as Json,
      denied_permissions: [] as Json,
    };

    let data: StaffMember;
    if (existing) {
      const { data: updated, error } = await supabase
        .from("staff_members")
        .update({
          ...row,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      data = updated as StaffMember;
    } else {
      const { data: inserted, error } = await supabase
        .from("staff_members")
        .insert(row)
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      data = inserted as StaffMember;
    }

    await supabase.from("staff_activity_log").insert({
      staff_id: staff.id,
      staff_name: staff.full_name,
      action: auth.emailSent ? "Invited new staff member" : "Added existing auth user as staff",
      entity_type: "staff",
      entity_id: data.id,
      details: { role: parsed.data.role, emailSent: auth.emailSent },
    });

    return NextResponse.json({
      ok: true,
      staff: toStaffProfile(data as StaffMember & Record<string, unknown>),
      emailSent: auth.emailSent,
      redirectTo: auth.redirectTo,
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
