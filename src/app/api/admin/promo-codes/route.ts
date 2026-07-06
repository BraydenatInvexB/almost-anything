import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import type { ProductCategory } from "@/types/database";
import type { PromoCodeInput } from "@/lib/admin/operations-promo-types";
import {
  createPromoCode,
  deletePromoCode,
  listPromoCodes,
  updatePromoCode,
} from "@/lib/admin/operations-persistence";

const promoSchema = z.object({
  code: z.string().min(2).max(40),
  label: z.string().optional(),
  status: z.enum(["draft", "active", "paused", "expired"]),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.number().positive(),
  scope: z.enum(["all", "products", "categories"]),
  productIds: z.array(z.string()).default([]),
  categorySlugs: z.array(z.string()).default([]),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  usageLimit: z.number().int().min(1).optional(),
});

function toPromoInput(data: z.infer<typeof promoSchema>) {
  return {
    ...data,
    categorySlugs: data.categorySlugs as ProductCategory[],
  };
}

function toPromoPatch(data: Partial<z.infer<typeof promoSchema>>): Partial<PromoCodeInput> {
  return {
    ...data,
    categorySlugs: data.categorySlugs as ProductCategory[] | undefined,
  };
}

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "marketing.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ promoCodes: await listPromoCodes() });
}

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "marketing.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = promoSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const promo = await createPromoCode(toPromoInput(parsed.data));
  return NextResponse.json({ ok: true, promoCode: promo });
}

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "marketing.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { id, ...patch } = body;
  const parsed = promoSchema.partial().safeParse(patch);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const promo = await updatePromoCode(id, toPromoPatch(parsed.data));
  if (!promo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, promoCode: promo });
}

export async function DELETE(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "marketing.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await deletePromoCode(id);
  return NextResponse.json({ ok: true });
}
