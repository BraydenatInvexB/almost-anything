"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Truck,
  Wallet,
  Warehouse,
  Tag,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { SELLER_NAV, SELLER_NAV_GROUP_ORDER } from "@/config/seller-nav";
import { cn } from "@/lib/utils/cn";

export const SELLER_NAV_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Truck,
  Wallet,
  Warehouse,
  Tag,
  CreditCard,
};

export type SellerNavGroup = {
  group: (typeof SELLER_NAV_GROUP_ORDER)[number];
  items: (typeof SELLER_NAV)[number][];
};

export function SellerNavList({
  groups,
  pathname,
  onNavigate,
}: {
  groups: SellerNavGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-5">
      {groups.map(({ group, items }) => (
        <div key={group}>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            {group}
          </p>
          <div className="flex flex-col gap-0.5">
            {items.map((item) => {
              const Icon = SELLER_NAV_ICONS[item.icon] ?? LayoutDashboard;
              const active =
                item.href === "/seller"
                  ? pathname === "/seller"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand/10 font-semibold text-brand ring-1 ring-brand/15"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      active ? "text-brand" : "text-neutral-400 group-hover:text-neutral-600",
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
