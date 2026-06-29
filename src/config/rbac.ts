import type { StaffRole } from "@/types/database";
import type { StaffProfile } from "@/types/staff-access";

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
  | "activity.view";

const ALL_PERMISSIONS: Permission[] = [
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
];

export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  manager: [
    "dashboard.view",
    "products.view",
    "products.edit",
    "products.markup",
    "orders.view",
    "orders.manage",
    "customers.view",
    "customers.manage",
    "support.view",
    "support.manage",
    "marketing.view",
    "finance.view",
    "inventory.view",
    "inventory.manage",
    "returns.view",
    "returns.manage",
    "procurement.view",
    "procurement.manage",
    "analytics.view",
    "searches.view",
    "settings.view",
    "activity.view",
  ],
  support_agent: [
    "dashboard.view",
    "orders.view",
    "customers.view",
    "customers.reset_password",
    "support.view",
    "support.manage",
    "returns.view",
    "returns.manage",
  ],
  marketing: [
    "dashboard.view",
    "products.view",
    "products.edit",
    "marketing.view",
    "marketing.manage",
    "analytics.view",
    "searches.view",
  ],
  fulfillment: [
    "dashboard.view",
    "orders.view",
    "orders.manage",
    "products.view",
    "inventory.view",
    "inventory.manage",
    "procurement.view",
    "procurement.manage",
    "searches.view",
  ],
  finance: [
    "dashboard.view",
    "orders.view",
    "finance.view",
    "finance.manage",
    "returns.view",
    "returns.manage",
    "analytics.view",
    "activity.view",
    "searches.view",
  ],
  hr: [
    "dashboard.view",
    "staff.view",
    "staff.manage",
    "hr.view",
    "hr.manage",
    "activity.view",
  ],
  analyst: [
    "dashboard.view",
    "products.view",
    "orders.view",
    "customers.view",
    "support.view",
    "marketing.view",
    "finance.view",
    "analytics.view",
    "settings.view",
    "activity.view",
    "searches.view",
  ],
};

export const ROLE_META: Record<
  StaffRole,
  { label: string; description: string; accent: string }
> = {
  super_admin: {
    label: "Super Admin",
    description: "Full control of the platform, staff, and settings.",
    accent: "bg-neutral-900 text-white",
  },
  admin: {
    label: "Administrator",
    description: "Broad operational control across the business.",
    accent: "bg-violet-100 text-violet-700",
  },
  manager: {
    label: "Operations Manager",
    description: "Oversees catalog, orders, customers, and support.",
    accent: "bg-blue-100 text-blue-700",
  },
  support_agent: {
    label: "Support Agent",
    description: "Helpdesk, customer assistance, and order lookups.",
    accent: "bg-emerald-100 text-emerald-700",
  },
  marketing: {
    label: "Marketing",
    description: "Promotions, deals, featured products, and campaigns.",
    accent: "bg-amber-100 text-amber-700",
  },
  fulfillment: {
    label: "Fulfillment",
    description: "Order processing, inventory, and shipping management.",
    accent: "bg-cyan-100 text-cyan-700",
  },
  finance: {
    label: "Finance",
    description: "Revenue, expenses, refunds, and financial reporting.",
    accent: "bg-emerald-100 text-emerald-800",
  },
  hr: {
    label: "Human Resources",
    description: "Employee records, roles, departments, and compliance.",
    accent: "bg-pink-100 text-pink-700",
  },
  analyst: {
    label: "Analyst",
    description: "Read-only access to dashboards and reports.",
    accent: "bg-neutral-200 text-neutral-700",
  },
};

export function getRolePermissions(role: StaffRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** Effective permissions = role defaults + extras − denied. */
export function getEffectivePermissions(staff: StaffProfile): Permission[] {
  const set = new Set(getRolePermissions(staff.role));
  for (const p of staff.extra_permissions ?? []) set.add(p);
  for (const p of staff.denied_permissions ?? []) set.delete(p);
  return Array.from(set);
}

export function staffCan(
  staff: StaffProfile | null | undefined,
  permission: Permission,
): boolean {
  if (!staff) return false;
  if (staff.denied_permissions?.includes(permission)) return false;
  if (staff.extra_permissions?.includes(permission)) return true;
  return ROLE_PERMISSIONS[staff.role]?.includes(permission) ?? false;
}

export function can(role: StaffRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

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

export function canAny(role: StaffRole | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

export function staffCanAny(staff: StaffProfile | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => staffCan(staff, p));
}

export interface AdminNavItem {
  label: string;
  href: string;
  icon: string;
  permission: Permission;
  group: "Overview" | "Commerce" | "People" | "Finance" | "Growth" | "System";
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard", permission: "dashboard.view", group: "Overview" },
  { label: "Analytics", href: "/admin/analytics", icon: "Activity", permission: "analytics.view", group: "Overview" },
  { label: "Reports", href: "/admin/reports", icon: "BarChart3", permission: "dashboard.view", group: "Overview" },
  { label: "Products", href: "/admin/products", icon: "Package", permission: "products.view", group: "Commerce" },
  { label: "Inventory", href: "/admin/inventory", icon: "Warehouse", permission: "inventory.view", group: "Commerce" },
  { label: "Orders", href: "/admin/orders", icon: "ShoppingCart", permission: "orders.view", group: "Commerce" },
  { label: "Fulfillment", href: "/admin/fulfillment", icon: "Truck", permission: "orders.view", group: "Commerce" },
  { label: "Procurement", href: "/admin/procurement", icon: "Globe", permission: "procurement.view", group: "Commerce" },
  { label: "Item Requests", href: "/admin/requests", icon: "Search", permission: "procurement.view", group: "Commerce" },
  { label: "Returns", href: "/admin/returns", icon: "RotateCcw", permission: "returns.view", group: "Commerce" },
  { label: "Customers", href: "/admin/customers", icon: "Users", permission: "customers.view", group: "People" },
  { label: "Support", href: "/admin/support", icon: "LifeBuoy", permission: "support.view", group: "People" },
  { label: "HR & Staff", href: "/admin/hr", icon: "Building2", permission: "staff.view", group: "People" },
  { label: "Finance", href: "/admin/finance", icon: "Wallet", permission: "finance.view", group: "Finance" },
  { label: "Marketing", href: "/admin/marketing", icon: "Megaphone", permission: "marketing.view", group: "Growth" },
  { label: "Searches", href: "/admin/searches", icon: "Search", permission: "searches.view", group: "Growth" },
  { label: "Activity Log", href: "/admin/activity", icon: "ScrollText", permission: "activity.view", group: "System" },
  { label: "Settings", href: "/admin/settings", icon: "Settings", permission: "settings.view", group: "System" },
];
