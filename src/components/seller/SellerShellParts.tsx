"use client";

import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Menu, X } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { SELLER_LOGIN_PATH } from "@/config/console-auth";
import { ConsoleSignOutButton } from "@/components/layout/ConsoleSignOutButton";
import { SellerNavList, type SellerNavGroup } from "@/components/seller/SellerNavList";
import type { SellerProfile } from "@/types/seller";

export function SellerShellSidebar({
  seller,
  groups,
  pathname,
  mobileOpen,
  onMobileClose,
}: {
  seller: SellerProfile;
  groups: SellerNavGroup[];
  pathname: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const sidebar = (
    <>
      <Link href="/seller" className="mb-5 flex items-center px-1 py-1">
        <Image
          src={SITE_CONFIG.logo}
          alt={SITE_CONFIG.name}
          width={240}
          height={56}
          className="h-14 w-full max-w-[220px] object-contain object-left"
          priority
        />
      </Link>
      <div className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Your shop</p>
        <p className="mt-1 truncate text-sm font-semibold text-neutral-900">{seller.shopName}</p>
        <p className="truncate text-xs text-neutral-500">{seller.companyName}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <SellerNavList groups={groups} pathname={pathname} />
      </div>
      <Link
        href="/"
        className="mt-4 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-white hover:text-neutral-900"
      >
        <ExternalLink className="h-4 w-4" />
        View storefront
      </Link>
      <ConsoleSignOutButton redirectTo={SELLER_LOGIN_PATH} />
    </>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-[17.5rem] shrink-0 flex-col border-r border-neutral-200/80 bg-white px-4 py-5 shadow-[1px_0_0_0_rgba(0,0,0,0.04)] lg:flex">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-neutral-900/20 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-neutral-200 bg-white px-4 py-5 shadow-xl">
            <div className="mb-4 flex justify-end">
              <button onClick={onMobileClose} aria-label="Close menu" className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}
    </>
  );
}

export function SellerShellHeader({
  pageTitle,
  onOpenMobileMenu,
}: {
  pageTitle: string;
  onOpenMobileMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-200/80 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Seller hub</p>
          <h1 className="text-lg font-semibold text-neutral-900">{pageTitle}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/sell" className="hidden text-sm font-medium text-brand hover:underline sm:inline">
          Seller resources
        </Link>
        <ConsoleSignOutButton redirectTo={SELLER_LOGIN_PATH} variant="header" />
      </div>
    </header>
  );
}
