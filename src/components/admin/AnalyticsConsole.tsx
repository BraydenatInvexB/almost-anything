"use client";

import { useMemo, useState } from "react";
import type { SiteAnalytics } from "@/lib/admin/operations-types";
import { Panel, StatCard } from "@/components/admin/ui";

export function AnalyticsConsole({ analytics }: { analytics: SiteAnalytics }) {
  const [range, setRange] = useState<"7d" | "30d">("7d");

  const days = useMemo(() => {
    const slice = range === "7d" ? analytics.dailyVisits.slice(-7) : analytics.dailyVisits;
    const max = Math.max(...slice.map((d) => d.visits), 1);
    return { slice, max };
  }, [analytics, range]);

  const totals = useMemo(() => {
    const visits = days.slice.reduce((s, d) => s + d.visits, 0);
    const orders = days.slice.reduce((s, d) => s + d.orders, 0);
    return { visits, orders, conversion: visits ? ((orders / visits) * 100).toFixed(1) : "0" };
  }, [days]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["7d", "30d"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              range === r ? "bg-brand text-white" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            Last {r === "7d" ? "7 days" : "30 days"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Visits" value={totals.visits.toLocaleString()} accent="bg-brand" />
        <StatCard label="Orders" value={String(totals.orders)} accent="bg-neutral-800" />
        <StatCard label="Conversion" value={`${totals.conversion}%`} accent="bg-emerald-600" />
        <StatCard
          label="Page views"
          value={analytics.pageViews.toLocaleString()}
          accent="bg-blue-600"
        />
      </div>

      <Panel title="Traffic vs orders">
        <div className="flex h-52 items-end gap-2 px-5 py-6">
          {days.slice.map((d) => {
            const visitHeight = Math.max(
              d.visits > 0 ? 4 : 0,
              Math.round((d.visits / days.max) * 176),
            );
            const orderHeight = Math.max(
              d.orders > 0 ? 4 : 0,
              Math.round((d.orders / days.max) * 176),
            );
            return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-end justify-center gap-0.5">
                <div
                  className="w-1/2 rounded-t bg-brand/80"
                  style={{ height: visitHeight }}
                  title={`${d.visits} visits`}
                />
                <div
                  className="w-1/2 rounded-t bg-neutral-300"
                  style={{ height: orderHeight }}
                  title={`${d.orders} orders`}
                />
              </div>
              <span className="text-[9px] text-neutral-400">{d.date.slice(5)}</span>
            </div>
            );
          })}
        </div>
        <p className="border-t border-neutral-100 px-5 py-2 text-xs text-neutral-500">
          Red = visits · Grey = orders
        </p>
      </Panel>

      <Panel title="Top pages">
        <ul className="divide-y divide-neutral-100">
          {analytics.topPages.map((p) => (
            <li key={p.path} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="font-medium">{p.path}</span>
              <span className="tabular-nums text-neutral-500">{p.views.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
