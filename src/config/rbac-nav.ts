import type { Permission } from "@/config/rbac-permissions";

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
