"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import type { AdminNotificationSummary } from "@/lib/admin/notifications";
import { cn } from "@/lib/utils/cn";

const POLL_MS = 60_000;

export function AdminNotifications({ initial }: { initial: AdminNotificationSummary }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(initial);

  useEffect(() => {
    setSummary(initial);
  }, [initial]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/admin/notifications");
        if (!res.ok) return;
        const data = (await res.json()) as AdminNotificationSummary;
        if (!cancelled) setSummary(data);
      } catch {
        /* ignore transient network errors */
      }
    }

    const id = window.setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const { total, items } = summary;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50",
          open && "border-brand/30 bg-brand/5 text-brand",
        )}
        aria-label={total > 0 ? `${total} notifications` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
            <div className="border-b border-neutral-100 px-4 py-3">
              <p className="text-sm font-semibold text-neutral-900">Notifications</p>
              <p className="text-xs text-neutral-500">
                {total > 0
                  ? `${total} item${total === 1 ? "" : "s"} need attention`
                  : "You're all caught up"}
              </p>
            </div>
            {items.length > 0 ? (
              <ul className="max-h-80 overflow-y-auto p-2">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-neutral-50"
                    >
                      <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-700">
                        {item.count > 9 ? "9+" : item.count}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-neutral-900">{item.title}</span>
                        <span className="block truncate text-xs text-neutral-500">{item.description}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-neutral-500">No open alerts right now.</p>
            )}
            {items.length > 0 && (
              <div className="border-t border-neutral-100 p-2">
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-brand hover:bg-brand/5"
                >
                  View dashboard
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
