import type { SellerPlan } from "@/types/seller";

export interface SellerPlanConfig {
  id: SellerPlan;
  name: string;
  priceMonthly: number;
  currency: string;
  itemLimit: number | null;
  description: string;
}

export const SELLER_PLANS: SellerPlanConfig[] = [
  {
    id: "starter_30",
    name: "Starter",
    priceMonthly: 499,
    currency: "ZAR",
    itemLimit: 30,
    description: "Up to 30 active listings — ideal for small shops getting started online.",
  },
  {
    id: "growth_50",
    name: "Growth",
    priceMonthly: 549,
    currency: "ZAR",
    itemLimit: 50,
    description: "Up to 50 active listings — for growing businesses with a wider catalog.",
  },
  {
    id: "unlimited",
    name: "Unlimited",
    priceMonthly: 599,
    currency: "ZAR",
    itemLimit: null,
    description: "Unlimited listings — no caps on how many products you can sell.",
  },
];

export const SELLER_PLAN_BY_ID = Object.fromEntries(
  SELLER_PLANS.map((plan) => [plan.id, plan]),
) as Record<SellerPlan, SellerPlanConfig>;

export function getSellerItemLimit(plan: SellerPlan): number | null {
  return SELLER_PLAN_BY_ID[plan]?.itemLimit ?? null;
}

export function formatPlanPrice(plan: SellerPlan): string {
  const config = SELLER_PLAN_BY_ID[plan];
  if (!config) return "";
  return `R${config.priceMonthly}/mo`;
}
