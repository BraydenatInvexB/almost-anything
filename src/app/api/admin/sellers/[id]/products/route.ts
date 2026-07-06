import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff, listSellerProductsForAdmin, moderateSellerProduct, sendAdminMessageToSeller } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";

const listingStatusSchema = z.enum([
  "published",
  "pending_review",
  "flagged",
  "removed",
  "archived",
]);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "sellers.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const products = await listSellerProductsForAdmin(id);
  return NextResponse.json({ products });
}

const patchSchema = z.object({
  productId: z.string().uuid(),
  listingStatus: listingStatusSchema,
  note: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "sellers.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { id } = await context.params;
  const product = await moderateSellerProduct({
    productId: parsed.data.productId,
    sellerId: id,
    listingStatus: parsed.data.listingStatus,
    note: parsed.data.note,
    staffName: staff.full_name,
  });

  if (parsed.data.note && (parsed.data.listingStatus === "flagged" || parsed.data.listingStatus === "removed")) {
    await sendAdminMessageToSeller({
      sellerId: id,
      staffName: staff.full_name,
      subject: `Listing ${parsed.data.listingStatus}: ${product.name}`,
      body: parsed.data.note,
      priority: "action_required",
    });
  }

  return NextResponse.json({ ok: true, product });
}
