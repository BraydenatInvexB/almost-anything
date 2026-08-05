"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, WalletCards, Truck } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { DRIVER_LOGIN_PATH } from "@/config/console-auth";
import { ConsoleSignOutButton } from "@/components/layout/ConsoleSignOutButton";
import type { DriverProfile } from "@/lib/delivery/types";

const NAV = [
  { href: "/driver", label: "Deliveries", icon: Truck },
  { href: "/driver/payouts", label: "Earnings & payouts", icon: WalletCards },
] as const;

export function DriverShell({
  driver,
  children,
}: {
  driver: DriverProfile;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <>
      <Link href="/driver" className="mb-5 flex items-center px-1 py-1">
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
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Driver</p>
        <p className="mt-1 truncate text-sm font-semibold text-neutral-900">{driver.fullName}</p>
        <p className="truncate text-xs text-neutral-500">{driver.province}</p>
        <p className="mt-1 text-[11px] font-medium capitalize text-neutral-500">{driver.status}</p>
      </div>
      <nav className="flex-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
          <Link
            key={item.href}
            href={item.href}
            className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            <Icon className="h-4 w-4" />{item.label}
          </Link>
        )})}
      </nav>
      <ConsoleSignOutButton redirectTo={DRIVER_LOGIN_PATH} />
    </>
  );

  return (
    <div className="flex min-h-dvh bg-[#f9f9f9] text-neutral-900">
      <aside className="sticky top-0 hidden h-dvh w-[17.5rem] shrink-0 flex-col border-r border-neutral-200/80 bg-white px-4 py-5 lg:flex">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-neutral-900/20" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-neutral-200 bg-white px-4 py-5 shadow-xl">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-neutral-200/80 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold">Driver dashboard</h1>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
