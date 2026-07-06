import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { submitSellerApplication } from "@/services/seller-service";
import { SELLER_ENTITY_TYPE_IDS } from "@/config/seller-entity-types";
import type { SellerEntityType } from "@/types/seller";

const entityTypeSchema = z.enum(
  SELLER_ENTITY_TYPE_IDS as [SellerEntityType, ...SellerEntityType[]],
);

const schema = z.object({
  shopName: z.string().min(2),
  companyName: z.string().min(2),
  entityType: entityTypeSchema,
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(7),
  description: z.string().optional(),
  plan: z.enum(["starter_30", "growth_50", "unlimited"]),
  categorySlugs: z.array(z.string()).default([]),
  sellsAllCategories: z.boolean().default(false),
  businessAddress: z.object({
    line1: z.string().min(3),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(3),
    country: z.string().default("ZA"),
  }),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid application" }, { status: 400 });
  }

  try {
    const seller = await submitSellerApplication(parsed.data);
    return NextResponse.json({ ok: true, seller });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Application failed" },
      { status: 400 },
    );
  }
}
