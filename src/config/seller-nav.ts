import type { SellerPermission } from "@/config/seller-permissions";

export interface SellerNavItem {
  label: string;
  href: string;
  icon: string;
  permission: SellerPermission;
  group: "Overview" | "Catalog" | "Sales" | "Team" | "Account";
}

export const SELLER_NAV: SellerNavItem[] = [
  { label: "Dashboard", href: "/seller", icon: "LayoutDashboard", permission: "dashboard.view", group: "Overview" },
  { label: "Products", href: "/seller/products", icon: "Package", permission: "products.view", group: "Catalog" },
  { label: "Inventory", href: "/seller/inventory", icon: "Warehouse", permission: "inventory.view", group: "Catalog" },
  { label: "Orders", href: "/seller/orders", icon: "ShoppingCart", permission: "orders.view", group: "Sales" },
  { label: "Promos", href: "/seller/promos", icon: "Tag", permission: "promos.view", group: "Sales" },
  { label: "Payouts", href: "/seller/payouts", icon: "Wallet", permission: "payouts.view", group: "Sales" },
  { label: "Team", href: "/seller/team", icon: "Users", permission: "team.view", group: "Team" },
  { label: "Subscription", href: "/seller/subscription", icon: "CreditCard", permission: "settings.view", group: "Account" },
  { label: "Settings", href: "/seller/settings", icon: "Settings", permission: "settings.view", group: "Account" },
];

export const SELLER_NAV_GROUP_ORDER = ["Overview", "Catalog", "Sales", "Team", "Account"] as const;
