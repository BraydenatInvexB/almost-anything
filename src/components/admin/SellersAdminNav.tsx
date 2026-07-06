"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { SellersAdminView } from "@/types/seller-admin";

const VIEWS: { id: SellersAdminView; label: string; countKey?: "documents" | "payouts" | "products" }[] = [
  { id: "sellers", label: "All sellers" },
  { id: "products", label: "All products", countKey: "products" },
  { id: "documents", label: "Documents", countKey: "documents" },
  { id: "payouts", label: "Payout requests", countKey: "payouts" },
];

export function SellersAdminNav({
  counts,
}: {
  counts: { products: number; documents: number; payouts: number };
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = (searchParams.get("view") as SellersAdminView | null) ?? "sellers";

  return (
    <div className="flex flex-wrap gap-2">
      {VIEWS.map((view) => {
        const params = new URLSearchParams(searchParams.toString());
        if (view.id === "sellers") {
          params.delete("view");
        } else {
          params.delete("status");
          params.set("view", view.id);
        }
        const href = params.size ? `${pathname}?${params}` : pathname;
        const count = view.countKey ? counts[view.countKey] : undefined;

        return (
          <Link
            key={view.id}
            href={href}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              active === view.id
                ? "border-brand bg-brand/10 text-brand"
                : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900",
            )}
          >
            {view.label}
            {count !== undefined ? <span className="ml-2 text-xs opacity-70">{count}</span> : null}
          </Link>
        );
      })}
    </div>
  );
}
