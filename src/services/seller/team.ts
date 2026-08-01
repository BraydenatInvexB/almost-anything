import {
  isSellerAssignableRole,
  type SellerAssignableRole,
} from "@/config/seller-team-roles";
import { provisionSellerTeamAuthUser } from "@/lib/seller/invite-auth";
import { mapSellerTeamMember } from "@/lib/seller/seller-mapper";
import { sellerDb } from "@/lib/seller/db";
import type { SellerProfile, SellerTeamMember } from "@/types/seller";

type TeamMemberRow = Record<string, unknown>;

function asMember(row: TeamMemberRow): SellerTeamMember {
  return mapSellerTeamMember(row);
}

export async function listSellerTeam(sellerId: string): Promise<SellerTeamMember[]> {
  const { data, error } = await sellerDb()
    .from("seller_team_members")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at");

  if (error) throw error;
  return (data ?? []).map((row) => asMember(row as TeamMemberRow));
}

export async function inviteSellerTeamMember(
  seller: SellerProfile,
  input: { email: string; fullName: string; role: SellerAssignableRole },
  options?: { resend?: boolean; request?: Request },
): Promise<{ member: SellerTeamMember; emailSent: boolean; redirectTo: string }> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const db = sellerDb();

  const { data: existing } = await db
    .from("seller_team_members")
    .select("*")
    .eq("seller_id", seller.id)
    .ilike("email", email)
    .maybeSingle();

  if (existing && existing.status !== "invited" && !options?.resend) {
    throw new Error("A team member with this email already exists.");
  }

  if (existing?.role === "owner") {
    throw new Error("The shop owner cannot be re-invited.");
  }

  const auth = await provisionSellerTeamAuthUser(db, email, fullName, {
    resend: true,
    request: options?.request,
  });
  if ("error" in auth) {
    throw new Error(auth.error);
  }

  if (!auth.emailSent) {
    throw new Error(
      "Could not send the password setup email. Check Supabase Auth email/SMTP settings and try again.",
    );
  }

  // Stay invited until they open the email link and set a password.
  const status = "invited" as const;

  const row = {
    seller_id: seller.id,
    email,
    full_name: fullName,
    role: input.role,
    status,
    user_id: auth.userId,
    permissions: [] as string[],
    updated_at: new Date().toISOString(),
  };

  let saved: TeamMemberRow;
  if (existing) {
    const { data, error } = await db
      .from("seller_team_members")
      .update(row)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    saved = data as TeamMemberRow;
  } else {
    const { data, error } = await db
      .from("seller_team_members")
      .insert(row)
      .select("*")
      .single();
    if (error) throw error;
    saved = data as TeamMemberRow;
  }

  return {
    member: asMember(saved),
    emailSent: auth.emailSent,
    redirectTo: auth.redirectTo,
  };
}

export async function updateSellerTeamMember(
  sellerId: string,
  memberId: string,
  updates: {
    role?: SellerAssignableRole;
    status?: "invited" | "active" | "suspended";
    fullName?: string;
  },
): Promise<SellerTeamMember> {
  const db = sellerDb();
  const { data: existing, error: fetchError } = await db
    .from("seller_team_members")
    .select("*")
    .eq("id", memberId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Team member not found.");
  if (existing.role === "owner") {
    throw new Error("The shop owner cannot be edited here.");
  }

  if (updates.role && !isSellerAssignableRole(updates.role)) {
    throw new Error("Invalid role.");
  }

  const { data, error } = await db
    .from("seller_team_members")
    .update({
      ...(updates.role ? { role: updates.role } : {}),
      ...(updates.status ? { status: updates.status } : {}),
      ...(updates.fullName?.trim() ? { full_name: updates.fullName.trim() } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("seller_id", sellerId)
    .select("*")
    .single();

  if (error) throw error;
  return asMember(data as TeamMemberRow);
}

export async function removeSellerTeamMember(
  sellerId: string,
  memberId: string,
): Promise<void> {
  const db = sellerDb();
  const { data: existing, error: fetchError } = await db
    .from("seller_team_members")
    .select("id, role")
    .eq("id", memberId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Team member not found.");
  if (existing.role === "owner") {
    throw new Error("The shop owner cannot be removed.");
  }

  const { error } = await db
    .from("seller_team_members")
    .delete()
    .eq("id", memberId)
    .eq("seller_id", sellerId);

  if (error) throw error;
}

/**
 * Link an invited (or email-matched) team row to the signed-in auth user and activate it.
 */
export async function activateSellerTeamMembership(
  userId: string,
  email: string | null | undefined,
): Promise<SellerTeamMember | null> {
  const db = sellerDb();
  const normalizedEmail = email?.trim().toLowerCase();

  const { data: byUser } = await db
    .from("seller_team_members")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "invited"])
    .maybeSingle();

  if (byUser) {
    if (byUser.status === "suspended") return null;
    if (byUser.status === "active" && byUser.user_id === userId) {
      return asMember(byUser as TeamMemberRow);
    }
    const { data: updated } = await db
      .from("seller_team_members")
      .update({
        user_id: userId,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", byUser.id)
      .select("*")
      .single();
    return updated ? asMember(updated as TeamMemberRow) : asMember(byUser as TeamMemberRow);
  }

  if (!normalizedEmail) return null;

  const { data: byEmail } = await db
    .from("seller_team_members")
    .select("*")
    .ilike("email", normalizedEmail)
    .in("status", ["active", "invited"])
    .maybeSingle();

  if (!byEmail || byEmail.status === "suspended") return null;

  const { data: updated } = await db
    .from("seller_team_members")
    .update({
      user_id: userId,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", byEmail.id)
    .select("*")
    .single();

  return updated ? asMember(updated as TeamMemberRow) : asMember(byEmail as TeamMemberRow);
}
