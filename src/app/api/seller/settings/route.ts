import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedSellerApi } from "@/services/seller/access-guard";
import { updateSellerDefaultStockOrigin } from "@/services/seller/settings";
import { sellerCan } from "@/config/seller-rbac";

const patchSchema = z.object({
  defaultStockOrigin: z.enum(["sa_warehouse", "overseas"]),
});

export async function PATCH(request: Request) {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;
  if (!sellerCan(seller, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
  }

  try {
    const defaultStockOrigin = await updateSellerDefaultStockOrigin(
      seller.id,
      parsed.data.defaultStockOrigin,
    );
    return NextResponse.json({ ok: true, defaultStockOrigin });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save settings" },
      { status: 500 },
    );
  }
}
