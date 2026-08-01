import {
  SELLER_ROLE_PERMISSIONS,
  type SellerPermission,
} from "@/config/seller-permissions";
import type { SellerTeamMember, SellerTeamRole } from "@/types/seller";

/**
 * Optional capability packs owners can grant on top of a member's role.
 * Keep these as permission bundles so new finance features stay in one place.
 */
export type SellerTeamGrant = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  permissions: readonly SellerPermission[];
};

export const SELLER_FINANCE_GRANT = {
  id: "finance",
  label: "Revenue & finances",
  shortLabel: "Show revenue",
  description: "Gross sales on the dashboard, financial overview, and payouts",
  permissions: ["finance.view", "payouts.view"] as const satisfies readonly SellerPermission[],
} satisfies SellerTeamGrant;

/** Grants that can be toggled from the team desk. */
export const SELLER_TEAM_GRANTS: readonly SellerTeamGrant[] = [SELLER_FINANCE_GRANT];

export function roleIncludesGrant(role: SellerTeamRole, grant: SellerTeamGrant): boolean {
  const rolePerms = SELLER_ROLE_PERMISSIONS[role] ?? [];
  return grant.permissions.every((permission) => rolePerms.includes(permission));
}

export function memberHasGrant(
  member: Pick<SellerTeamMember, "role" | "permissions">,
  grant: SellerTeamGrant,
): boolean {
  if (roleIncludesGrant(member.role, grant)) return true;
  const extras = new Set(member.permissions ?? []);
  return grant.permissions.every((permission) => extras.has(permission));
}

export function applyTeamGrant(
  currentPermissions: string[],
  grant: SellerTeamGrant,
  enabled: boolean,
): string[] {
  const next = new Set(currentPermissions);
  for (const permission of grant.permissions) {
    if (enabled) next.add(permission);
    else next.delete(permission);
  }
  return [...next];
}
