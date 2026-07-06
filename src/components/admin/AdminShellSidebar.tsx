"use client";

import Link from "next/link";
import Image from "next/image";
import { ExternalLink, X } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { ConsoleSignOutButton } from "@/components/layout/ConsoleSignOutButton";
import { AdminNavList, type AdminNavGroup } from "@/components/admin/AdminNavList";

export function AdminShellSidebar({
  groups,
  pathname,
  mobileOpen,
  onMobileClose,
}: {
  groups: AdminNavGroup[];
  pathname: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  return (
    <>
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
        <ConsoleSignOutButton redirectTo="/admin/login" />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-neutral-900/20 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-neutral-200 bg-white px-4 py-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-1">
              <Link
                href="/admin"
                onClick={onMobileClose}
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
                onClick={onMobileClose}
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
                onNavigate={onMobileClose}
              />
            </div>
            <Link
              href="/"
              onClick={onMobileClose}
              className="mt-4 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-medium text-neutral-600"
            >
              <ExternalLink className="h-4 w-4" />
              View storefront
            </Link>
            <ConsoleSignOutButton redirectTo="/admin/login" />
          </aside>
        </div>
      )}
    </>
  );
}
