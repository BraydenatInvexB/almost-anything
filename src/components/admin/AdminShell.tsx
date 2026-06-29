"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
  Truck,
  BarChart3,
  Wallet,
  Warehouse,
  RotateCcw,
  Globe,
  Building2,
  Activity,
  type LucideIcon,
} from "lucide-react";
import type { StaffProfile } from "@/types/staff-access";
import { ADMIN_NAV, ROLE_META, staffCan } from "@/config/rbac";
import { SITE_CONFIG } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/context/AuthProvider";

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
  Truck,
  BarChart3,
  Wallet,
  Warehouse,
  RotateCcw,
  Globe,
  Building2,
  Activity,
  Search,
};

const GROUP_ORDER = ["Overview", "Commerce", "People", "Finance", "Growth", "System"] as const;

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
    <nav className="flex flex-col gap-5">
      {groups.map(({ group, items }) => (
        <div key={group}>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
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

export function AdminSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (/^AA\d/i.test(q) || /^\d{4}$/.test(q)) {
      router.push(`/admin/orders?q=${encodeURIComponent(q)}`);
      return;
    }
    if (q.includes("@")) {
      router.push(`/admin/customers?q=${encodeURIComponent(q)}`);
      return;
    }
    router.push(`/admin/products?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative min-w-0 flex-1 sm:max-w-lg">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search…"
        aria-label="Search orders, customers, and products"
        className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm placeholder:text-neutral-400 focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/10"
      />
    </form>
  );
}

export function AdminShell({
  staff,
  children,
  alerts = 0,
}: {
  staff: StaffProfile;
  children: React.ReactNode;
  alerts?: number;
}) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleNav = ADMIN_NAV.filter((item) => staffCan(staff, item.permission));
  const roleMeta = ROLE_META[staff.role];

  const groups = useMemo(
    () =>
      GROUP_ORDER.map((g) => ({
        group: g,
        items: visibleNav.filter((i) => i.group === g),
      })).filter((g) => g.items.length > 0),
    [visibleNav],
  );

  const pageTitle = useMemo(() => {
    const match = ADMIN_NAV.find((item) =>
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href),
    );
    if (pathname.includes("/orders/")) return "Order detail";
    if (pathname.includes("/customers/")) return "Customer profile";
    if (pathname.includes("/support/")) return "Support ticket";
    if (pathname.includes("/returns/")) return "Return detail";
    if (pathname.includes("/requests")) return "Item requests";
    return match?.label ?? "Admin";
  }, [pathname]);

  return (
    <div className="flex min-h-dvh bg-[#f4f6f9] text-neutral-900">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-[17.5rem] shrink-0 flex-col border-r border-neutral-200/80 bg-white px-4 py-5 shadow-[1px_0_0_0_rgba(0,0,0,0.04)] lg:flex">
        <Link href="/admin" className="mb-5 flex items-center px-1 py-1">
          <Image
            src={SITE_CONFIG.logo}
            alt={SITE_CONFIG.name}
            width={240}
            height={56}
            className="h-14 w-full max-w-[220px] object-contain object-left"
            priority
          />
        </Link>
        <p className="mb-5 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          Operations console
        </p>

        <div className="flex-1 overflow-y-auto">
          <AdminNavList groups={groups} pathname={pathname} />
        </div>

        <Link
          href="/"
          className="mt-4 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-white hover:text-neutral-900"
        >
          <ExternalLink className="h-4 w-4" />
          View storefront
        </Link>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-neutral-900/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-neutral-200 bg-white px-4 py-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-1">
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex flex-1 items-center py-1"
              >
                <Image
                  src={SITE_CONFIG.logo}
                  alt={SITE_CONFIG.name}
                  width={160}
                  height={40}
                  className="h-9 w-full object-contain object-left"
                />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="ml-2 rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Operations console
            </p>
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
        <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/admin" className="shrink-0 rounded-lg bg-white px-2 py-1 lg:hidden">
              <Image
                src={SITE_CONFIG.logo}
                alt={SITE_CONFIG.name}
                width={140}
                height={36}
                className="h-8 w-auto"
                priority
              />
            </Link>

            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-semibold text-neutral-950">{pageTitle}</p>
              <p className="truncate text-xs text-neutral-500">{roleMeta.label}</p>
            </div>

            <AdminSearch />

            <div className="ml-auto flex items-center gap-2">
              {staffCan(staff, "support.view") && (
                <Link
                  href="/admin/support"
                  className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50"
                  aria-label="Support queue"
                >
                  <Bell className="h-4 w-4" />
                  {alerts > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                      {alerts > 9 ? "9+" : alerts}
                    </span>
                  )}
                </Link>
              )}

              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 py-1 pl-1 pr-2.5 hover:bg-neutral-50"
                >
                  {staff.avatar_url ? (
                    <Image
                      src={staff.avatar_url}
                      alt={staff.full_name}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-xs font-bold text-brand">
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
                    <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl">
                      <div className="rounded-lg bg-neutral-50 p-3">
                        <p className="text-sm font-semibold">{staff.full_name}</p>
                        <p className="truncate text-xs text-neutral-500">{staff.email}</p>
                        <span
                          className={cn(
                            "mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold",
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
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
