"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  UserCog,
  LifeBuoy,
  Megaphone,
  ScrollText,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { ADMIN_NAV, ROLE_META, can } from "@/config/rbac";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/context/AuthProvider";
import type { StaffMember } from "@/types/database";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  UserCog,
  LifeBuoy,
  Megaphone,
  ScrollText,
  Settings,
};

const GROUP_ORDER = ["Overview", "Commerce", "People", "Growth", "System"] as const;

type NavGroup = {
  group: (typeof GROUP_ORDER)[number];
  items: (typeof ADMIN_NAV)[number][];
};

function AdminNavList({
  groups,
  pathname,
  onNavigate,
}: {
  groups: NavGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-6">
      {groups.map(({ group, items }) => (
        <div key={group}>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            {group}
          </p>
          <div className="flex flex-col gap-0.5">
            {items.map((item) => {
              const Icon = ICONS[item.icon] ?? LayoutDashboard;
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
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

export function AdminShell({
  staff,
  children,
}: {
  staff: StaffMember;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleNav = ADMIN_NAV.filter((item) => can(staff.role, item.permission));
  const roleMeta = ROLE_META[staff.role];

  const groups = GROUP_ORDER.map((g) => ({
    group: g,
    items: visibleNav.filter((i) => i.group === g),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex min-h-dvh bg-neutral-50 text-neutral-900">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-neutral-200 bg-white px-4 py-5 lg:flex">
        <Link href="/admin" className="mb-7 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900">
            <span className="text-sm font-bold text-brand">AA</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">Almost Anything</p>
            <p className="text-[11px] text-neutral-400">Admin Console</p>
          </div>
        </Link>

        <div className="flex-1 overflow-y-auto">
          <AdminNavList groups={groups} pathname={pathname} />
        </div>

        <Link
          href="/"
          className="mt-4 flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          <ExternalLink className="h-4 w-4" />
          View storefront
        </Link>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white px-4 py-5">
            <div className="mb-7 flex items-center justify-between px-2">
              <span className="text-sm font-bold">Admin Console</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminNavList
                groups={groups}
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden max-w-md flex-1 items-center sm:flex">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-neutral-400" />
            <input
              placeholder="Search orders, customers, products..."
              className="h-9 w-full rounded-full border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-neutral-200 py-1 pl-1 pr-2.5 hover:bg-neutral-50"
              >
                {staff.avatar_url ? (
                  <Image
                    src={staff.avatar_url}
                    alt={staff.full_name}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                    {staff.full_name.charAt(0)}
                  </span>
                )}
                <span className="hidden text-sm font-medium sm:block">
                  {staff.full_name.split(" ")[0]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-60 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
                    <div className="rounded-xl bg-neutral-50 p-3">
                      <p className="text-sm font-semibold">{staff.full_name}</p>
                      <p className="truncate text-xs text-neutral-500">{staff.email}</p>
                      <span
                        className={cn(
                          "mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          roleMeta.accent,
                        )}
                      >
                        {roleMeta.label}
                      </span>
                    </div>
                    <Link
                      href="/account"
                      className="mt-1 block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      My account
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
