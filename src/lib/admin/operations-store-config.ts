import { COURIERS } from "@/config/couriers";
import type { ConfigCourier, ExtendedPlatformConfig } from "@/lib/admin/operations-types";
import { mergeExtendedConfig } from "@/lib/admin/extended-config-defaults";
import { state, type StaffAccessOverride } from "@/lib/admin/operations-store-core";

export function getExtendedConfig() {
  if (!state.config.couriers?.length) {
    state.config.couriers = COURIERS.map((c) => ({ ...c }));
  }
  return state.config;
}

export function updateExtendedConfig(patch: Partial<ExtendedPlatformConfig>) {
  state.config = mergeExtendedConfig({ ...state.config, ...patch });
  return state.config;
}

export function getStaffOverrides(id: string) {
  return state.staffOverrides[id] ?? null;
}

export function updateStaffAccess(id: string, patch: StaffAccessOverride) {
  state.staffOverrides[id] = { ...state.staffOverrides[id], ...patch };
  return state.staffOverrides[id];
}

export function removeStaffMemberDemo(id: string) {
  if (!state.deletedStaffIds.includes(id)) {
    state.deletedStaffIds.push(id);
  }
}

export function isStaffMemberDeleted(id: string) {
  return state.deletedStaffIds.includes(id);
}

export function addCourier(input: Omit<ConfigCourier, "id"> & { id?: string }) {
  const id =
    input.id ??
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");
  const courier: ConfigCourier = {
    id,
    name: input.name,
    baseCost: input.baseCost,
    etaLabel: input.etaLabel,
    regions: input.regions,
  };
  if (!state.config.couriers.find((c) => c.id === id)) {
    state.config.couriers.push(courier);
    state.config.enabledCourierIds.push(id);
  }
  return courier;
}

export function updateCourier(id: string, patch: Partial<ConfigCourier>) {
  const idx = state.config.couriers.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  state.config.couriers[idx] = { ...state.config.couriers[idx], ...patch };
  return state.config.couriers[idx];
}

export function removeCourier(id: string) {
  state.config.couriers = state.config.couriers.filter((c) => c.id !== id);
  state.config.enabledCourierIds = state.config.enabledCourierIds.filter((x) => x !== id);
  if (state.config.defaultCourierId === id) {
    state.config.defaultCourierId = state.config.enabledCourierIds[0] ?? "";
  }
}
