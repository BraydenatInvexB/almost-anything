import { COURIERS } from "@/config/couriers";
import type { ExtendedPlatformConfig } from "@/lib/admin/operations-types";

export const DEFAULT_EXTENDED_CONFIG: ExtendedPlatformConfig = {
  embedShippingInPrice: true,
  defaultCourierId: "aramex",
  enabledCourierIds: ["courier_guy", "fastway", "aramex"],
  currency: "ZAR",
  couriers: COURIERS.map((c) => ({ ...c })),
};

export function mergeExtendedConfig(
  partial: Partial<ExtendedPlatformConfig> | Record<string, unknown> | null | undefined,
): ExtendedPlatformConfig {
  if (!partial || typeof partial !== "object") return { ...DEFAULT_EXTENDED_CONFIG };
  return {
    ...DEFAULT_EXTENDED_CONFIG,
    ...partial,
    couriers:
      Array.isArray(partial.couriers) && partial.couriers.length > 0
        ? (partial.couriers as ExtendedPlatformConfig["couriers"])
        : DEFAULT_EXTENDED_CONFIG.couriers,
    enabledCourierIds:
      Array.isArray(partial.enabledCourierIds) && partial.enabledCourierIds.length > 0
        ? (partial.enabledCourierIds as string[])
        : DEFAULT_EXTENDED_CONFIG.enabledCourierIds,
  };
}
