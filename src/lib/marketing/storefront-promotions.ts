import "server-only";

import type { Campaign } from "@/lib/admin/operations-types";
import { listCampaigns } from "@/lib/admin/operations-persistence";

export interface StorefrontPromotion {
  id: string;
  label: string;
  slug: string;
  productSlugs: string[];
  startsAt: string;
  endsAt?: string;
}

export function toPromotionSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function campaignIsActiveOnStorefront(
  campaign: Campaign,
  at = new Date(),
): boolean {
  if (!campaign.storefrontEnabled || !campaign.storefrontLabel || !campaign.storefrontSlug) {
    return false;
  }
  if (campaign.status !== "live" && campaign.status !== "scheduled") return false;

  const timestamp = at.getTime();
  const startsAt = Date.parse(campaign.startsAt);
  const endsAt = campaign.endsAt ? Date.parse(campaign.endsAt) : Number.POSITIVE_INFINITY;

  return Number.isFinite(startsAt) && startsAt <= timestamp && timestamp <= endsAt;
}

function toStorefrontPromotion(campaign: Campaign): StorefrontPromotion {
  return {
    id: campaign.id,
    label: campaign.storefrontLabel ?? campaign.name,
    slug: campaign.storefrontSlug ?? toPromotionSlug(campaign.name),
    productSlugs: campaign.storefrontProductSlugs,
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
  };
}

export async function listActiveStorefrontPromotions(
  at = new Date(),
): Promise<StorefrontPromotion[]> {
  const campaigns = await listCampaigns();
  return campaigns
    .filter((campaign) => campaignIsActiveOnStorefront(campaign, at))
    .sort(
      (a, b) =>
        a.storefrontOrder - b.storefrontOrder ||
        Date.parse(a.startsAt) - Date.parse(b.startsAt),
    )
    .map(toStorefrontPromotion);
}

export async function getActiveStorefrontPromotion(
  slug: string,
  at = new Date(),
): Promise<StorefrontPromotion | null> {
  const normalizedSlug = toPromotionSlug(slug);
  const promotions = await listActiveStorefrontPromotions(at);
  return promotions.find((promotion) => promotion.slug === normalizedSlug) ?? null;
}
