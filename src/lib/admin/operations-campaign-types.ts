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
  reach: number;
  clicks: number;
  createdAt: string;
}
