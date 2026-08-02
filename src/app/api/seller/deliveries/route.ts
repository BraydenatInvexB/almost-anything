import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedSellerApi } from "@/services/seller/access-guard";
import { sellerCan } from "@/config/seller-rbac";
import { listDeliveryJobs, updateDeliveryJobStatus } from "@/services/delivery/jobs";

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["out_for_delivery", "delivered", "awaiting_seller"]),
});

export async function PATCH(request: Request) {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;
  if (!sellerCan(seller, "orders.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const jobs = await listDeliveryJobs({ sellerId: seller.id, limit: 200 });
  const job = jobs.find((j) => j.id === parsed.data.id && j.mode === "seller_self");
  if (!job) return NextResponse.json({ error: "Delivery not found" }, { status: 404 });

  const result = await updateDeliveryJobStatus(parsed.data.id, parsed.data.status);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
