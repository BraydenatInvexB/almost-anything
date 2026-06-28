import type { StaffRole } from "@/types/database";

/**
 * Granular permission keys used across the admin panel. Pages and actions are
 * gated against these rather than against roles directly, so the role→capability
 * mapping can evolve without touching UI code.
 */
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
  ],
  marketing: [
    "dashboard.view",
    "products.view",
    "products.edit",
    "marketing.view",
    "marketing.manage",
  ],
  fulfillment: [
    "dashboard.view",
    "orders.view",
    "orders.manage",
    "products.view",
  ],
  analyst: [
    "dashboard.view",
    "products.view",
    "orders.view",
    "customers.view",
    "support.view",
    "marketing.view",
    "settings.view",
    "activity.view",
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
    description: "Promotions, deals, featured products, and newsletter.",
    accent: "bg-amber-100 text-amber-700",
  },
  fulfillment: {
    label: "Fulfillment",
    description: "Order processing and shipping management.",
    accent: "bg-cyan-100 text-cyan-700",
  },
  analyst: {
    label: "Analyst",
    description: "Read-only access to dashboards and reports.",
    accent: "bg-neutral-200 text-neutral-700",
  },
};

export function can(role: StaffRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAny(role: StaffRole | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

/** Admin sidebar navigation — each entry is gated by a permission. */
export interface AdminNavItem {
  label: string;
  href: string;
  icon: string; // lucide-react icon name, resolved in the AdminSidebar
  permission: Permission;
  group: "Overview" | "Commerce" | "People" | "Growth" | "System";
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard", permission: "dashboard.view", group: "Overview" },
  { label: "Products", href: "/admin/products", icon: "Package", permission: "products.view", group: "Commerce" },
  { label: "Orders", href: "/admin/orders", icon: "ShoppingCart", permission: "orders.view", group: "Commerce" },
  { label: "Customers", href: "/admin/customers", icon: "Users", permission: "customers.view", group: "People" },
  { label: "Staff", href: "/admin/staff", icon: "UserCog", permission: "staff.view", group: "People" },
  { label: "Support", href: "/admin/support", icon: "LifeBuoy", permission: "support.view", group: "People" },
  { label: "Marketing", href: "/admin/marketing", icon: "Megaphone", permission: "marketing.view", group: "Growth" },
  { label: "Activity Log", href: "/admin/activity", icon: "ScrollText", permission: "activity.view", group: "System" },
  { label: "Settings", href: "/admin/settings", icon: "Settings", permission: "settings.view", group: "System" },
];
