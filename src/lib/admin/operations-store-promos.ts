import type { PromoCode, PromoCodeInput } from "@/lib/admin/operations-promo-types";
import { state } from "@/lib/admin/operations-store-core";

export function normalizePromoCodeValue(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function listPromoCodes(): PromoCode[] {
  return state.promoCodes;
}

export function getPromoByCode(code: string): PromoCode | null {
  const normalized = normalizePromoCodeValue(code);
  return state.promoCodes.find((p) => p.code === normalized) ?? null;
}

export function createPromoCode(input: PromoCodeInput): PromoCode {
  const now = new Date().toISOString();
  const promo: PromoCode = {
    ...input,
    code: normalizePromoCodeValue(input.code),
    id: `promo-${Date.now()}`,
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  state.promoCodes.unshift(promo);
  return promo;
}

export function updatePromoCode(id: string, patch: Partial<PromoCodeInput>): PromoCode | null {
  const idx = state.promoCodes.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const next = { ...state.promoCodes[idx], ...patch, updatedAt: new Date().toISOString() };
  if (patch.code) next.code = normalizePromoCodeValue(patch.code);
  state.promoCodes[idx] = next;
  return next;
}

export function deletePromoCode(id: string): void {
  state.promoCodes = state.promoCodes.filter((p) => p.id !== id);
}

export function incrementPromoUsage(id: string): PromoCode | null {
  const idx = state.promoCodes.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  state.promoCodes[idx] = {
    ...state.promoCodes[idx],
    usageCount: state.promoCodes[idx].usageCount + 1,
    updatedAt: new Date().toISOString(),
  };
  return state.promoCodes[idx];
}
