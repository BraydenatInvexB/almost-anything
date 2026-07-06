import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedSellerApi } from "@/services/seller/access-guard";
import {
  createSellerProduct,
  listSellerProducts,
  setSellerProductListingIntent,
  updateSellerProductStock,
} from "@/services/seller/products";
import { sellerCan } from "@/config/seller-rbac";

const deliverySchema = z.object({
  customerPaysDelivery: z.boolean().default(true),
  deliveryFeeZar: z.number().min(0).nullable().optional(),
});

const createSchema = z
  .object({
    name: z.string().min(2),
    costPrice: z.number().min(0),
    markupPercent: z.number().min(0).max(500),
    retailPrice: z.number().min(0).optional(),
    stockQuantity: z.number().int().min(0),
    category: z.string().min(1),
    imageUrls: z.array(z.string()).default([]),
    description: z.string().optional(),
    deliveryDaysMin: z.number().int().min(1).optional(),
    deliveryDaysMax: z.number().int().min(1).optional(),
    delivery: deliverySchema.optional(),
    saveIntent: z.enum(["draft", "list"]).default("list"),
  })
  .superRefine((data, ctx) => {
    if (data.saveIntent === "list" && data.costPrice <= 0) {
      ctx.addIssue({ code: "custom", message: "Cost price is required to list a product", path: ["costPrice"] });
    }
  });

const patchSchema = z
  .object({
    id: z.string().uuid(),
    stockQuantity: z.number().int().min(0).optional(),
    listingAction: z.enum(["draft", "list"]).optional(),
  })
  .refine((data) => data.stockQuantity !== undefined || data.listingAction !== undefined, {
    message: "No update specified",
  });

export async function GET() {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;
  if (!sellerCan(seller, "products.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const products = await listSellerProducts(seller.id);
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;
  if (!sellerCan(seller, "products.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid product data" }, { status: 400 });
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
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  try {
    if (parsed.data.stockQuantity !== undefined) {
      if (!sellerCan(seller, "inventory.manage")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const product = await updateSellerProductStock(seller.id, parsed.data.id, parsed.data.stockQuantity);
      return NextResponse.json({ ok: true, product });
    }

    if (parsed.data.listingAction) {
      if (!sellerCan(seller, "products.edit")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const product = await setSellerProductListingIntent(seller, parsed.data.id, parsed.data.listingAction);
      return NextResponse.json({ ok: true, product });
    }

    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update product" },
      { status: 400 },
    );
  }
}
