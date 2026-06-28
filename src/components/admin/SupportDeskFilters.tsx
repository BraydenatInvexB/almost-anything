"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SUPPORT_CATEGORIES } from "@/lib/support/helpdesk";

const STATUS_FILTERS = ["all", "open", "pending", "resolved", "closed"] as const;

export function SupportDeskFilters({
  currentStatus,
  currentCategory,
  currentQuery,
}: {
  currentStatus: string;
  currentCategory: string;
  currentQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function push(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    }
    router.push(`/admin/support?${params.toString()}`);
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => push({ status: f === "all" ? null : f })}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors",
              currentStatus === f
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get("q") as string;
            push({ q: q.trim() || null });
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            name="q"
            defaultValue={currentQuery}
            placeholder="Search tickets, customers, order #…"
            className="input w-full pl-9"
          />
        </form>
        <select
          className="input sm:w-44"
          value={currentCategory}
          onChange={(e) => push({ category: e.target.value === "all" ? null : e.target.value })}
        >
          <option value="all">All categories</option>
          {SUPPORT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
