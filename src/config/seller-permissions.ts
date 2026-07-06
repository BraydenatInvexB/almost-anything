export type SellerPermission =
  | "dashboard.view"
  | "products.view"
  | "products.edit"
  | "inventory.view"
  | "inventory.manage"
  | "orders.view"
  | "orders.fulfill"
  | "promos.view"
  | "promos.manage"
  | "team.view"
  | "team.manage"
  | "payouts.view"
  | "payouts.request"
  | "settings.view"
  | "settings.manage";

export const ALL_SELLER_PERMISSIONS: SellerPermission[] = [
  "dashboard.view",
  "products.view",
  "products.edit",
  "inventory.view",
  "inventory.manage",
  "orders.view",
  "orders.fulfill",
  "promos.view",
  "promos.manage",
  "team.view",
  "team.manage",
  "payouts.view",
  "payouts.request",
  "settings.view",
  "settings.manage",
];

export const SELLER_ROLE_PERMISSIONS: Record<string, SellerPermission[]> = {
  owner: ALL_SELLER_PERMISSIONS,
  manager: ALL_SELLER_PERMISSIONS.filter((p) => !p.startsWith("team.manage") && !p.startsWith("settings.manage")),
  inventory: ["dashboard.view", "products.view", "products.edit", "inventory.view", "inventory.manage", "orders.view"],
  support: ["dashboard.view", "orders.view", "orders.fulfill"],
  staff: ["dashboard.view", "products.view", "orders.view"],
};
