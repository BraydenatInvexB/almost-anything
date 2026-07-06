import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSeller } from "@/services/seller-service";
import { sellerDb } from "@/lib/seller/db";
import { sellerCan } from "@/config/seller-rbac";

const schema = z.object({ amount: z.number().positive() });

export async function POST(request: Request) {
  const seller = await getCurrentSeller();
  if (!seller || !sellerCan(seller, "payouts.request")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const { data, error } = await sellerDb()
    .from("seller_payouts")
    .insert({
      seller_id: seller.id,
      amount: parsed.data.amount,
      currency: "ZAR",
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, payoutId: data.id });
}
