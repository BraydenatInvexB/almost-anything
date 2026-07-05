import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { DEMO_STAFF, DEMO_SUPER_ADMIN } from "@/lib/admin/demo-data";
import {
  getStaffOverrides,
  updateStaffAccess,
  isStaffMemberDeleted,
} from "@/lib/admin/operations-store";
import { toStaffProfile } from "@/lib/staff/profile";
import { createServiceClient } from "@/lib/supabase/admin";
import type { StaffProfile } from "@/types/staff-access";
import type { StaffMember } from "@/types/database";

export function isAdminLiveMode(): boolean {
  return isSupabaseConfigured();
}

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
  if (isStaffMemberDeleted(id)) return null;
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
