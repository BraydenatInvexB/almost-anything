import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedSellerApi } from "@/services/seller/access-guard";
import { sellerDb } from "@/lib/seller/db";
import { sellerCan } from "@/config/seller-rbac";

export async function GET() {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;
  if (!sellerCan(seller, "promos.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await sellerDb()
    .from("promo_codes")
    .select("id, code, discount_type, discount_value, status")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ promos: data ?? [] });
}

const schema = z.object({
  code: z.string().min(3).max(20),
  discountValue: z.number().positive(),
  discountType: z.enum(["percent", "fixed"]).default("percent"),
});

export async function POST(request: Request) {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;
  if (!sellerCan(seller, "promos.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid promo" }, { status: 400 });
  }

  const { data, error } = await sellerDb()
    .from("promo_codes")
    .insert({
      code: parsed.data.code.toUpperCase(),
      discount_type: parsed.data.discountType,
      discount_value: parsed.data.discountValue,
      scope: "products",
      status: "active",
      seller_id: seller.id,
    })
    .select("id, code, discount_type, discount_value, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ promo: data });
}
