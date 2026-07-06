import type { ProductCategory } from "@/types/database";

export type PromoCodeStatus = "draft" | "active" | "paused" | "expired";
export type PromoDiscountType = "percent" | "fixed";
export type PromoScope = "all" | "products" | "categories";

export interface PromoCode {
  id: string;
  code: string;
  label?: string;
  status: PromoCodeStatus;
  discountType: PromoDiscountType;
  discountValue: number;
  scope: PromoScope;
  productIds: string[];
  categorySlugs: ProductCategory[];
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export type PromoCodeInput = Omit<
  PromoCode,
  "id" | "usageCount" | "createdAt" | "updatedAt"
>;
