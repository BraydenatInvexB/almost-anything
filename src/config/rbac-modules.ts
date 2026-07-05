import type { Permission } from "@/config/rbac-permissions";

export const PERMISSION_MODULES: {
  id: string;
  label: string;
  description: string;
  permissions: { key: Permission; label: string; manage?: boolean }[];
}[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Dashboard, analytics, and reports",
    permissions: [
      { key: "dashboard.view", label: "View dashboard & reports" },
      { key: "analytics.view", label: "View analytics" },
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    description: "Products, orders, inventory, procurement, returns",
    permissions: [
      { key: "products.view", label: "View products" },
      { key: "products.edit", label: "Create & edit products", manage: true },
      { key: "products.markup", label: "Adjust pricing & markup", manage: true },
      { key: "orders.view", label: "View orders" },
      { key: "orders.manage", label: "Manage orders & fulfillment", manage: true },
      { key: "inventory.view", label: "View inventory" },
      { key: "inventory.manage", label: "Adjust inventory", manage: true },
      { key: "procurement.view", label: "View procurement" },
      { key: "procurement.manage", label: "Manage procurement", manage: true },
      { key: "returns.view", label: "View returns" },
      { key: "returns.manage", label: "Process returns & refunds", manage: true },
    ],
  },
  {
    id: "people",
    label: "People",
    description: "Customers, support desk, staff, HR",
    permissions: [
      { key: "customers.view", label: "View customers" },
      { key: "customers.manage", label: "Manage customers", manage: true },
      { key: "customers.reset_password", label: "Reset customer passwords", manage: true },
      { key: "support.view", label: "View support desk" },
      { key: "support.manage", label: "Reply & manage tickets", manage: true },
      { key: "staff.view", label: "View staff directory" },
      { key: "staff.manage", label: "Invite & manage staff", manage: true },
      { key: "hr.view", label: "View HR module" },
      { key: "hr.manage", label: "Manage HR records", manage: true },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    description: "Revenue, expenses, payables, refunds",
    permissions: [
      { key: "finance.view", label: "View finance" },
      { key: "finance.manage", label: "Record expenses & payables", manage: true },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    description: "Marketing and campaigns",
    permissions: [
      { key: "marketing.view", label: "View marketing" },
      { key: "marketing.manage", label: "Manage campaigns", manage: true },
    ],
  },
  {
    id: "system",
    label: "System",
    description: "Settings and audit log",
    permissions: [
      { key: "settings.view", label: "View platform settings" },
      { key: "settings.manage", label: "Edit platform settings", manage: true },
      { key: "activity.view", label: "View activity log" },
    ],
  },
];
