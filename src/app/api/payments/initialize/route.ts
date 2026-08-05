import { NextResponse } from "next/server";
import { z } from "zod";
import { createHostedPaymentRequest } from "@/lib/payments/provider-request";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SELLER_PLAN_BY_ID } from "@/config/seller-plans";
import type { SellerPlan } from "@/types/seller";

const schema = z.object({
  provider: z.enum(["payfast", "ozow"]),
  purpose: z.enum(["checkout", "seller_subscription"]),
  orderNumber: z.string().optional(),
  sellerId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment request." }, { status: 400 });
  const input = parsed.data;
  const db = createServiceClient();
  try {
    if (input.purpose === "checkout") {
      if (!input.orderNumber) throw new Error("Order number is required.");
      const { data: order } = await db.from("orders").select("order_number,total,shipping_address,status").eq("order_number", input.orderNumber).maybeSingle();
      if (!order) throw new Error("Order not found.");
      if (order.status !== "pending") throw new Error("This order cannot be paid again.");
      const address = (order.shipping_address ?? {}) as Record<string, string>;
      const reference = `CHK-${order.order_number}`;
      const hosted = createHostedPaymentRequest({ provider: input.provider, purpose: input.purpose, reference, amount: Number(order.total), itemName: `Order ${order.order_number}`, customerEmail: address.email ?? "customer@almostanything.co.za" });
      await db.from("orders").update({ payment_intent_id: reference, payment_method: input.provider }).eq("order_number", order.order_number);
      return NextResponse.json(hosted);
    }

    if (!input.sellerId) throw new Error("Seller id is required.");
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) throw new Error("Sign in required.");
    const { data: seller } = await db.from("sellers").select("id,user_id,plan,contact_email").eq("id", input.sellerId).maybeSingle();
    if (!seller || seller.user_id !== user.id) throw new Error("Seller account not found.");
    const plan = SELLER_PLAN_BY_ID[seller.plan as SellerPlan];
    if (!plan) throw new Error("Unknown seller plan.");
    const reference = `SUB-${seller.id}`;
    return NextResponse.json(createHostedPaymentRequest({ provider: input.provider, purpose: input.purpose, reference, amount: plan.priceMonthly, itemName: `${plan.name} seller subscription`, customerEmail: seller.contact_email }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start payment." }, { status: 400 });
  }
}
