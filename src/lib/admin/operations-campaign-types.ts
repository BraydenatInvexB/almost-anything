export type CampaignStatus = "draft" | "scheduled" | "live" | "ended";
export type CampaignChannel = "email" | "banner" | "push" | "sms" | "multi";

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  promoCode?: string;
  discountPercent?: number;
  audience: string;
  startsAt: string;
  endsAt?: string;
  /** When enabled, the campaign appears as a scheduled collection in the storefront tab row. */
  storefrontEnabled: boolean;
  /** Short, customer-facing label such as "Father's Day". */
  storefrontLabel?: string;
  /** Stable URL key used by /products?event=. */
  storefrontSlug?: string;
  /** Product slugs included in the promotional collection. */
  storefrontProductSlugs: string[];
  /** Lower values are shown first when more than one promotion is active. */
  storefrontOrder: number;
  reach: number;
  clicks: number;
  createdAt: string;
}
