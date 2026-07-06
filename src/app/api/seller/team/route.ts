import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedSellerApi } from "@/services/seller/access-guard";
import { mapSellerTeamMember } from "@/lib/seller/seller-mapper";
import { sellerDb } from "@/lib/seller/db";
import { sellerCan } from "@/config/seller-rbac";

export async function GET() {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;
  if (!sellerCan(seller, "team.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await sellerDb()
    .from("seller_team_members")
    .select("*")
    .eq("seller_id", seller.id)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    team: (data ?? []).map((row) => mapSellerTeamMember(row as Record<string, unknown>)),
  });
}

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(["manager", "inventory", "support", "staff"]).default("staff"),
});

export async function POST(request: Request) {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;
  if (!sellerCan(seller, "team.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
  }

  const { data, error } = await sellerDb()
    .from("seller_team_members")
    .insert({
      seller_id: seller.id,
      email: parsed.data.email.toLowerCase(),
      full_name: parsed.data.fullName,
      role: parsed.data.role,
      status: "invited",
      permissions: [],
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ member: mapSellerTeamMember(data as Record<string, unknown>) });
}
