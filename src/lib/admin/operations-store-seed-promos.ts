import type { PromoCode } from "@/lib/admin/operations-promo-types";

type IsoFn = (daysAgo?: number, hoursAgo?: number) => string;

export function seedPromoCodes(iso: IsoFn): PromoCode[] {
  return [
    {
      id: "promo-001",
      code: "WELCOME10",
      label: "10% off your first order",
      status: "active",
      discountType: "percent",
      discountValue: 10,
      scope: "all",
      productIds: [],
      categorySlugs: [],
      minOrderAmount: 200,
      maxDiscountAmount: 500,
      usageLimit: 1000,
      usageCount: 42,
      startsAt: iso(30),
      createdAt: iso(30),
      updatedAt: iso(0),
    },
    {
      id: "promo-002",
      code: "SLEEP50",
      label: "R50 off sleepwear & lingerie",
      status: "active",
      discountType: "fixed",
      discountValue: 50,
      scope: "categories",
      productIds: [],
      categorySlugs: ["sleepwear", "lingerie"],
      usageCount: 8,
      createdAt: iso(14),
      updatedAt: iso(0),
    },
  ];
}
