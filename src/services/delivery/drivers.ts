import "server-only";

import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeProvince } from "@/config/provinces";
import type { DriverProfile, DriverStatus } from "@/lib/delivery/types";

export type { DriverProfile, DriverStatus };

function mapDriver(row: {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  phone: string | null;
  province: string;
  status: string;
  vehicle_notes: string | null;
  verification_status?: string | null;
}): DriverProfile {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    province: row.province,
    status: row.status as DriverStatus,
    vehicleNotes: row.vehicle_notes,
    verificationStatus: (row.verification_status ?? "incomplete") as DriverProfile["verificationStatus"],
  };
}

export async function getCurrentDriver(): Promise<DriverProfile | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const auth = await createClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    if (!user) return null;

    const supabase = createServiceClient();
    const { data } = await supabase.from("drivers").select("*").eq("user_id", user.id).maybeSingle();

    if (data) return mapDriver(data);

    if (user.email) {
      const { data: byEmail } = await supabase
        .from("drivers")
        .select("*")
        .ilike("email", user.email)
        .maybeSingle();
      if (byEmail) {
        await supabase
          .from("drivers")
          .update({ user_id: user.id, updated_at: new Date().toISOString() })
          .eq("id", byEmail.id);
        return mapDriver({ ...byEmail, user_id: user.id });
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function registerDriver(input: {
  email: string;
  fullName: string;
  phone?: string;
  province: string;
  vehicleNotes?: string;
  userId?: string | null;
}): Promise<{ driver: DriverProfile } | { error: string }> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };
  try {
    const supabase = createServiceClient();
    const email = input.email.trim().toLowerCase();
    const { data: existing } = await supabase.from("drivers").select("id").ilike("email", email).maybeSingle();
    if (existing) return { error: "A driver account already exists for this email." };

    const { data, error } = await supabase
      .from("drivers")
      .insert({
        email,
        full_name: input.fullName.trim(),
        phone: input.phone?.trim() || null,
        province: normalizeProvince(input.province),
        vehicle_notes: input.vehicleNotes?.trim() || null,
        user_id: input.userId ?? null,
        status: "pending",
      })
      .select("*")
      .single();

    if (error || !data) return { error: error?.message ?? "Could not register driver" };
    return { driver: mapDriver(data) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not register driver" };
  }
}

export async function listDrivers(): Promise<DriverProfile[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("drivers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return (data ?? []).map(mapDriver);
  } catch {
    return [];
  }
}

export async function updateDriverStatus(
  id: string,
  status: DriverStatus,
): Promise<{ ok: true } | { error: string }> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };
  try {
    if (status === "active") {
      const { getDriverCompliance } = await import("@/services/delivery/compliance");
      const compliance = await getDriverCompliance(id);
      if (!compliance.readyForApproval) {
        return { error: "Approve the driver licence and bank proof before activating this driver." };
      }
    }
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("drivers")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed" };
  }
}
