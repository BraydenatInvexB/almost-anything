export type Permission =
  | "dashboard.view"
  | "products.view"
  | "products.edit"
  | "products.markup"
  | "orders.view"
  | "orders.manage"
  | "customers.view"
  | "customers.manage"
  | "customers.reset_password"
  | "staff.view"
  | "staff.manage"
  | "support.view"
  | "support.manage"
  | "marketing.view"
  | "marketing.manage"
  | "finance.view"
  | "finance.manage"
  | "inventory.view"
  | "inventory.manage"
  | "returns.view"
  | "returns.manage"
  | "procurement.view"
  | "procurement.manage"
  | "analytics.view"
  | "searches.view"
  | "hr.view"
  | "hr.manage"
  | "settings.view"
  | "settings.manage"
  | "activity.view"
  | "sellers.view"
  | "sellers.manage";

export const ALL_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "products.view",
  "products.edit",
  "products.markup",
  "orders.view",
  "orders.manage",
  "customers.view",
  "customers.manage",
  "customers.reset_password",
  "staff.view",
  "staff.manage",
  "support.view",
  "support.manage",
  "marketing.view",
  "marketing.manage",
  "finance.view",
  "finance.manage",
  "inventory.view",
  "inventory.manage",
  "returns.view",
  "returns.manage",
  "procurement.view",
  "procurement.manage",
  "analytics.view",
  "searches.view",
  "hr.view",
  "hr.manage",
  "settings.view",
  "settings.manage",
  "activity.view",
  "sellers.view",
  "sellers.manage",
];
