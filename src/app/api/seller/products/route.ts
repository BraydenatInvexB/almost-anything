import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSeller } from "@/services/seller-service";
import { createSellerProduct, listSellerProducts } from "@/services/seller/products";
import { sellerCan } from "@/config/seller-rbac";
import { uploadProductImage } from "@/lib/uploads/marketplace-upload";

const createSchema = z.object({
  name: z.string().min(2),
  retailPrice: z.number().positive(),
  stockQuantity: z.number().int().min(0),
  category: z.string().min(1),
  imageUrls: z.array(z.string()).default([]),
  description: z.string().optional(),
});

export async function GET() {
  const seller = await getCurrentSeller();
  if (!seller || !sellerCan(seller, "products.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const products = await listSellerProducts(seller.id);
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const seller = await getCurrentSeller();
  if (!seller || !sellerCan(seller, "products.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
  }

  try {
    const product = await createSellerProduct(seller, parsed.data);
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create product" },
      { status: 400 },
    );
  }
}
