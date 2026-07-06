"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { SellerDeskFilter } from "@/types/seller-admin";

const FILTERS: { id: SellerDeskFilter; label: string }[] = [
  { id: "all", label: "All sellers" },
  { id: "pending_review", label: "Applications" },
  { id: "approved", label: "Approved" },
  { id: "suspended", label: "Suspended" },
  { id: "rejected", label: "Rejected" },
];

export function SellersDeskFilters({ counts }: { counts: Record<SellerDeskFilter, number> }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = (searchParams.get("status") as SellerDeskFilter | null) ?? "all";

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const params = new URLSearchParams(searchParams.toString());
        if (filter.id === "all") params.delete("status");
        else params.set("status", filter.id);

        const href = params.size ? `${pathname}?${params}` : pathname;

        return (
          <Link
            key={filter.id}
            href={href}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active === filter.id
                ? "border-brand bg-brand/10 text-brand"
                : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900",
            )}
          >
            {filter.label}
            <span className="ml-2 text-xs opacity-70">{counts[filter.id] ?? 0}</span>
          </Link>
        );
      })}
    </div>
  );
}
