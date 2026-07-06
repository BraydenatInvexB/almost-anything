"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { AdminCatalogTab } from "@/types/seller-admin";

const TABS: { id: AdminCatalogTab; label: string }[] = [
  { id: "platform", label: "Platform catalog" },
  { id: "seller", label: "Seller products" },
];

export function AdminCatalogTabs({ sellerCount }: { sellerCount: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = (searchParams.get("tab") as AdminCatalogTab | null) ?? "platform";

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const params = new URLSearchParams(searchParams.toString());
        if (tab.id === "platform") params.delete("tab");
        else params.set("tab", tab.id);
        const href = params.size ? `${pathname}?${params}` : pathname;

        return (
          <Link
            key={tab.id}
            href={href}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              active === tab.id
                ? "border-brand bg-brand/10 text-brand"
                : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900",
            )}
          >
            {tab.label}
            {tab.id === "seller" ? (
              <span className="ml-2 text-xs opacity-70">{sellerCount}</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
