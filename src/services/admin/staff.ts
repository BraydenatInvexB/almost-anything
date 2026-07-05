import { createClient } from "@/lib/supabase/server";
import {
  DEMO_STAFF,
  DEMO_ACTIVITY,
  DEMO_SUPER_ADMIN,
} from "@/lib/admin/demo-data";
import {
  removeStaffMemberDemo,
  isStaffMemberDeleted,
} from "@/lib/admin/operations-store";
import { toStaffProfile } from "@/lib/staff/profile";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { StaffProfile } from "@/types/staff-access";
import type { StaffMember, StaffActivity } from "@/types/database";
import { getStaffProfile } from "./session";

export async function listStaff(): Promise<StaffProfile[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const res = await supabase
        .from("staff_members")
        .select("*")
        .order("created_at", { ascending: true });
      if (!res.error) {
        return ((res.data ?? []) as StaffMember[]).map((row) =>
          toStaffProfile(row as StaffMember & Record<string, unknown>),
        );
      }
    } catch {
      /* fall through */
    }
  }
  return DEMO_STAFF.filter((s) => !isStaffMemberDeleted(s.id)).map((s) => getStaffProfile(s.id)!);
}

export async function deleteStaffMember(
  id: string,
  actorId: string,
): Promise<{ ok: true } | { error: string }> {
  if (!isSupabaseConfigured()) {
    if (id === actorId) return { error: "You cannot remove your own account" };
    if (id === DEMO_SUPER_ADMIN.id) return { error: "Super admins cannot be removed" };
    if (!DEMO_STAFF.some((s) => s.id === id)) return { error: "Staff member not found" };
    removeStaffMemberDemo(id);
    return { ok: true };
  }

  try {
    const supabase = createServiceClient();
    const { data: target, error: fetchError } = await supabase
      .from("staff_members")
      .select("id, role, user_id, email, full_name")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) return { error: fetchError.message };
    if (!target) return { error: "Staff member not found" };
    if (target.id === actorId) return { error: "You cannot remove your own account" };
    if (target.role === "super_admin") return { error: "Super admins cannot be removed" };

    if (target.user_id) {
      const { error: authError } = await supabase.auth.admin.deleteUser(target.user_id);
      if (authError) return { error: authError.message };
    } else {
      const { error: deleteError } = await supabase.from("staff_members").delete().eq("id", id);
      if (deleteError) return { error: deleteError.message };
    }

    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not remove staff member" };
  }
}

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
