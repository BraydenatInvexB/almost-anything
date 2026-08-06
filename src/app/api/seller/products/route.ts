import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedSellerApi } from "@/services/seller/access-guard";
import {
  archiveSellerProduct,
  createSellerProduct,
  listSellerProducts,
  setSellerProductListingIntent,
  updateSellerProduct,
  updateSellerProductStock,
} from "@/services/seller/products";
import { sellerCan } from "@/config/seller-rbac";

const deliverySchema = z.object({
  customerPaysDelivery: z.boolean().default(true),
  deliveryFeeZar: z.number().min(0).nullable().optional(),
});

const supplierSchema = z.object({
  tracked: z.boolean(),
  name: z.string().optional(),
  contact: z.string().optional(),
  sku: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
});

const specialSchema = z.object({
  enabled: z.boolean(),
  compareAtPrice: z.number().min(0).nullable().optional(),
  salePrice: z.number().min(0).nullable().optional(),
});

const variantsSchema = z.object({
  options: z.array(
    z.object({
      name: z.string(),
      values: z.array(z.string()),
    }),
  ),
  variants: z.array(
    z.object({
      id: z.string(),
      selections: z.record(z.string(), z.string()),
      sku: z.string().optional(),
      priceAdjust: z.number().optional(),
      stock: z.number().optional(),
      imageUrl: z.string().optional(),
    }),
  ),
});

const enrichmentSchema = z.object({
  highlights: z.array(z.string()).default([]),
  specifications: z.record(z.string(), z.string()).default({}),
  summary: z.string().optional(),
});

const stockLocationsSchema = z.object({
  jhb: z.number().int().min(0),
  dbn: z.number().int().min(0),
  cpt: z.number().int().min(0),
});

const productWriteSchema = z
  .object({
    name: z.string().min(2),
    costPrice: z.number().min(0),
    markupPercent: z.number().min(0).max(500),
    retailPrice: z.number().min(0).optional(),
    stockQuantity: z.number().int().min(0),
    stockLocations: stockLocationsSchema,
    category: z.string().min(1),
    imageUrls: z.array(z.string()).default([]),
    description: z.string().optional(),
    deliveryDaysMin: z.number().int().min(1).optional(),
    deliveryDaysMax: z.number().int().min(1).optional(),
    deliverySize: z.enum(["small", "medium", "large", "bulky"]).optional(),
    delivery: deliverySchema.optional(),
    saveIntent: z.enum(["draft", "list"]).default("list"),
    stockOrigin: z.enum(["sa_warehouse", "overseas"]).optional(),
    supplier: supplierSchema.optional().nullable(),
    variants: variantsSchema.optional().nullable(),
    enrichment: enrichmentSchema.optional().nullable(),
    special: specialSchema.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.saveIntent === "list" && data.costPrice <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Cost price is required to list a product",
        path: ["costPrice"],
      });
    }
    if (
      data.special?.enabled &&
      data.special.compareAtPrice != null &&
      data.special.salePrice != null &&
      data.special.compareAtPrice <= data.special.salePrice
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Was price must be higher than the now price",
        path: ["special", "compareAtPrice"],
      });
    }
  });

const patchSchema = z
  .object({
    id: z.string().uuid(),
    stockQuantity: z.number().int().min(0).optional(),
    stockLocations: stockLocationsSchema.optional(),
    listingAction: z.enum(["draft", "list"]).optional(),
    product: productWriteSchema.optional(),
  })
  .refine(
    (data) =>
      data.stockQuantity !== undefined ||
      data.stockLocations !== undefined ||
      data.listingAction !== undefined ||
      data.product !== undefined,
    { message: "No update specified" },
  );

function toWriteInput(data: z.infer<typeof productWriteSchema>) {
  const { delivery, ...rest } = data;
  return {
    ...rest,
    delivery: delivery
      ? {
          customerPaysDelivery: delivery.customerPaysDelivery,
          deliveryFeeZar: delivery.deliveryFeeZar ?? null,
        }
      : undefined,
  };
}

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

  const parsed = productWriteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid product data" },
      { status: 400 },
    );
  }

  try {
    const product = await createSellerProduct(seller, toWriteInput(parsed.data));
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid update" },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.product) {
      if (!sellerCan(seller, "products.edit")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const product = await updateSellerProduct(
        seller,
        parsed.data.id,
        toWriteInput(parsed.data.product),
      );
      return NextResponse.json({ ok: true, product });
    }

    if (parsed.data.stockLocations !== undefined) {
      if (!sellerCan(seller, "inventory.manage")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const product = await updateSellerProductStock(
        seller.id,
        parsed.data.id,
        parsed.data.stockLocations,
      );
      return NextResponse.json({ ok: true, product });
    }

    if (parsed.data.stockQuantity !== undefined) {
      return NextResponse.json(
        { error: "Stock must be allocated to JHB, DBN, or CPT." },
        { status: 400 },
      );
    }

    if (parsed.data.listingAction) {
      if (!sellerCan(seller, "products.edit")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const product = await setSellerProductListingIntent(
        seller,
        parsed.data.id,
        parsed.data.listingAction,
      );
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

export async function DELETE(request: Request) {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;
  if (!sellerCan(seller, "products.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Product id is required" }, { status: 400 });
  }

  try {
    await archiveSellerProduct(seller, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not remove product" },
      { status: 400 },
    );
  }
}
