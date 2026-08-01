import type { SellerTeamMember, SellerTeamRole } from "@/types/seller";

/** Roles that can be assigned when inviting or editing employees (not owner). */
export const SELLER_ASSIGNABLE_ROLES = [
  "manager",
  "inventory",
  "support",
  "staff",
] as const satisfies Exclude<SellerTeamRole, "owner">[];

export type SellerAssignableRole = (typeof SELLER_ASSIGNABLE_ROLES)[number];

export const SELLER_TEAM_ROLE_META: Record<
  SellerTeamRole,
  { label: string; description: string }
> = {
  owner: {
    label: "Owner",
    description: "Full access to the seller account",
  },
  manager: {
    label: "Manager",
    description: "Catalog, orders, promos, and payouts — no team or settings changes",
  },
  inventory: {
    label: "Inventory",
    description: "Products and stock management",
  },
  support: {
    label: "Support / fulfillment",
    description: "Orders and fulfillment",
  },
  staff: {
    label: "Staff",
    description: "View dashboard, products, and orders",
  },
};

export function isSellerAssignableRole(role: string): role is SellerAssignableRole {
  return (SELLER_ASSIGNABLE_ROLES as readonly string[]).includes(role);
}

export function canManageSellerTeamMember(
  actorRole: SellerTeamRole,
  member: Pick<SellerTeamMember, "id" | "role">,
  actorMemberId?: string,
): boolean {
  if (actorRole !== "owner" && actorRole !== "manager") return false;
  if (member.role === "owner") return false;
  if (actorMemberId && member.id === actorMemberId) return false;
  // Managers can view team but cannot manage (team.manage). Keep role check here for UI.
  return actorRole === "owner";
}
