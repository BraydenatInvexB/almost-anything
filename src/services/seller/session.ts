import { createClient } from "@/lib/supabase/server";
import { mapSellerRow } from "@/lib/seller/seller-mapper";
import { sellerDb } from "@/lib/seller/db";
import type { SellerProfile, SellerTeamRole } from "@/types/seller";

async function resolveTeamRole(
  sellerId: string,
  userId: string,
): Promise<{ role: SellerTeamRole; permissions: string[] }> {
  const { data: member } = await sellerDb()
    .from("seller_team_members")
    .select("role, permissions")
    .eq("seller_id", sellerId)
    .eq("user_id", userId)
    .maybeSingle();

  if (member) {
    return {
      role: member.role as SellerTeamRole,
      permissions: Array.isArray(member.permissions) ? member.permissions.map(String) : [],
    };
  }

  return { role: "owner", permissions: [] };
}

export async function getCurrentSeller(): Promise<SellerProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const db = sellerDb();
  const { data: owned, error: ownedError } = await db
    .from("sellers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownedError) throw ownedError;

  if (owned) {
    const team = await resolveTeamRole(String(owned.id), user.id);
    return mapSellerRow(owned as Record<string, unknown>, team.role, team.permissions);
  }

  const { data: membership, error: memberError } = await db
    .from("seller_team_members")
    .select("seller_id, role, permissions")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (memberError) throw memberError;
  if (!membership) return null;

  const { data: seller, error: sellerError } = await db
    .from("sellers")
    .select("*")
    .eq("id", membership.seller_id)
    .maybeSingle();

  if (sellerError) throw sellerError;
  if (!seller || seller.status === "suspended") return null;

  return mapSellerRow(
    seller as Record<string, unknown>,
    membership.role as SellerTeamRole,
    Array.isArray(membership.permissions) ? membership.permissions.map(String) : [],
  );
}

export async function listApprovedSellers(): Promise<SellerProfile[]> {
  const { data, error } = await sellerDb()
    .from("sellers")
    .select("*")
    .eq("status", "approved")
    .order("shop_name");

  if (error) throw error;
  return (data ?? []).map((row) => mapSellerRow(row as Record<string, unknown>));
}

export async function getSellerBySlug(slug: string): Promise<SellerProfile | null> {
  const { data, error } = await sellerDb()
    .from("sellers")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  if (error) throw error;
  return data ? mapSellerRow(data as Record<string, unknown>) : null;
}
