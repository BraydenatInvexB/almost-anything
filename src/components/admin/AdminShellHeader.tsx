"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, ChevronDown, LogOut } from "lucide-react";
import type { StaffProfile } from "@/types/staff-access";
import { ROLE_META } from "@/config/rbac";
import { SITE_CONFIG } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/context/AuthProvider";
import type { AdminNotificationSummary } from "@/lib/admin/notifications";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { ConsoleSignOutButton } from "@/components/layout/ConsoleSignOutButton";

export function AdminShellHeader({
  staff,
  pageTitle,
  showNotifications,
  notifications,
  onOpenMobileMenu,
}: {
  staff: StaffProfile;
  pageTitle: string;
  showNotifications: boolean;
  notifications: AdminNotificationSummary;
  onOpenMobileMenu: () => void;
}) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const roleMeta = ROLE_META[staff.role];

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden"
          onClick={onOpenMobileMenu}
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
          {showNotifications && <AdminNotifications initial={notifications} />}
          <ConsoleSignOutButton redirectTo="/admin/login" variant="header" className="hidden md:inline-flex" />

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
                    href="/admin/settings"
                    className="mt-1 block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    Admin settings
                  </Link>
                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      await signOut();
                      router.push("/admin/login");
                      router.refresh();
                    }}
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
  );
}
