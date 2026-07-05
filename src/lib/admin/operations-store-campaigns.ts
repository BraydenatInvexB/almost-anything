import type { Campaign } from "@/lib/admin/operations-types";
import { state } from "@/lib/admin/operations-store-core";

export function listCampaigns() {
  return state.campaigns;
}

export function createCampaign(input: Omit<Campaign, "id" | "reach" | "clicks" | "createdAt">) {
  const campaign: Campaign = {
    ...input,
    id: `cmp-${Date.now()}`,
    reach: 0,
    clicks: 0,
    createdAt: new Date().toISOString(),
  };
  state.campaigns.unshift(campaign);
  return campaign;
}

export function updateCampaign(id: string, patch: Partial<Campaign>) {
  const idx = state.campaigns.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  state.campaigns[idx] = { ...state.campaigns[idx], ...patch };
  return state.campaigns[idx];
}

export function deleteCampaign(id: string) {
  state.campaigns = state.campaigns.filter((c) => c.id !== id);
}
