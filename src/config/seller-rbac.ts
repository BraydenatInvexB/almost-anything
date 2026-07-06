import {
  ALL_SELLER_PERMISSIONS,
  SELLER_ROLE_PERMISSIONS,
  type SellerPermission,
} from "@/config/seller-permissions";
import type { SellerProfile } from "@/types/seller";

export function getEffectiveSellerPermissions(seller: SellerProfile): SellerPermission[] {
  const rolePerms = SELLER_ROLE_PERMISSIONS[seller.role] ?? [];
  const extra = (seller.permissions ?? []).filter((p): p is SellerPermission =>
    ALL_SELLER_PERMISSIONS.includes(p as SellerPermission),
  );
  return [...new Set([...rolePerms, ...extra])];
}

export function sellerCan(seller: SellerProfile, permission: SellerPermission): boolean {
  return getEffectiveSellerPermissions(seller).includes(permission);
}
