import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCurrentStaff,
  listAllSellerProductsForAdmin,
  moderateSellerProduct,
  sendAdminMessageToSeller,
  updateSellerProductStorefront,
} from "@/services/admin-service";
import { staffCan } from "@/config/rbac";

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "products.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const products = await listAllSellerProductsForAdmin();
  return NextResponse.json({ products });
}

const storefrontSchema = z.object({
  id: z.string().uuid(),
  show_in_hot: z.boolean(),
  show_in_steals: z.boolean(),
  show_in_fresh_drops: z.boolean(),
});

const moderateSchema = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  listingStatus: z.enum(["draft", "published", "pending_review", "flagged", "removed", "archived"]),
  note: z.string().max(500).optional(),
});

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);

  const storefront = storefrontSchema.safeParse(body);
  if (storefront.success) {
    if (!staffCan(staff, "products.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const product = await updateSellerProductStorefront(storefront.data.id, {
      show_in_hot: storefront.data.show_in_hot,
      show_in_steals: storefront.data.show_in_steals,
      show_in_fresh_drops: storefront.data.show_in_fresh_drops,
    });
    return NextResponse.json({ ok: true, product });
  }

  const moderate = moderateSchema.safeParse(body);
  if (moderate.success) {
    if (!staffCan(staff, "sellers.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const product = await moderateSellerProduct({
      productId: moderate.data.id,
      sellerId: moderate.data.sellerId,
      listingStatus: moderate.data.listingStatus,
      note: moderate.data.note,
      staffName: staff.full_name,
    });
    if (
      moderate.data.note &&
      (moderate.data.listingStatus === "flagged" || moderate.data.listingStatus === "removed")
    ) {
      await sendAdminMessageToSeller({
        sellerId: moderate.data.sellerId,
        staffName: staff.full_name,
        subject: `Listing ${moderate.data.listingStatus}: ${product.name}`,
        body: moderate.data.note,
        priority: "action_required",
      });
    }
    return NextResponse.json({ ok: true, product });
  }

  return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
}
