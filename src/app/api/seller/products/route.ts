import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSeller } from "@/services/seller-service";
import { createSellerProduct, listSellerProducts, updateSellerProductStock } from "@/services/seller/products";
import { sellerCan } from "@/config/seller-rbac";

const deliverySchema = z.object({
  customerPaysDelivery: z.boolean().default(true),
  deliveryFeeZar: z.number().min(0).nullable().optional(),
});

const createSchema = z.object({
  name: z.string().min(2),
  costPrice: z.number().positive(),
  markupPercent: z.number().min(0).max(500),
  retailPrice: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0),
  category: z.string().min(1),
  imageUrls: z.array(z.string()).default([]),
  description: z.string().optional(),
  deliveryDaysMin: z.number().int().min(1).optional(),
  deliveryDaysMax: z.number().int().min(1).optional(),
  delivery: deliverySchema.optional(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  stockQuantity: z.number().int().min(0),
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
    const { delivery, ...rest } = parsed.data;
    const product = await createSellerProduct(seller, {
      ...rest,
      delivery: delivery
        ? { customerPaysDelivery: delivery.customerPaysDelivery, deliveryFeeZar: delivery.deliveryFeeZar ?? null }
        : undefined,
    });
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create product" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const seller = await getCurrentSeller();
  if (!seller || !sellerCan(seller, "inventory.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  try {
    const product = await updateSellerProductStock(seller.id, parsed.data.id, parsed.data.stockQuantity);
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update stock" },
      { status: 400 },
    );
  }
}
