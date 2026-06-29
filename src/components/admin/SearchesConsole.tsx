"use client";

import { useMemo, useState } from "react";
import type { SearchAnalyticsSummary } from "@/services/search-analytics-service";
import { Panel, StatCard } from "@/components/admin/ui";

type Props = {
  initial: SearchAnalyticsSummary;
};

export function SearchesConsole({ initial }: Props) {
  const [summary, setSummary] = useState(initial);
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const [loading, setLoading] = useState(false);

  async function loadRange(days: "7" | "30" | "90") {
    setRange(days);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/searches?days=${days}`);
      if (res.ok) setSummary(await res.json());
    } finally {
      setLoading(false);
    }
  }

  const chart = useMemo(() => {
    const slice = summary.dailyVolume;
    const max = Math.max(...slice.map((d) => d.searches), 1);
    return { slice, max };
  }, [summary.dailyVolume]);

  const zeroRate =
    summary.totalSearches > 0
      ? ((summary.zeroResultSearches / summary.totalSearches) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["7", "30", "90"] as const).map((r) => (
          <button
            key={r}
            type="button"
            disabled={loading}
            onClick={() => loadRange(r)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              range === r ? "bg-brand text-white" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            Last {r} days
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total searches" value={summary.totalSearches.toLocaleString()} accent="bg-brand" />
        <StatCard label="Unique queries" value={String(summary.uniqueQueries)} accent="bg-neutral-800" />
        <StatCard label="Zero results" value={String(summary.zeroResultSearches)} accent="bg-amber-600" />
        <StatCard label="Zero-result rate" value={`${zeroRate}%`} accent="bg-rose-600" />
      </div>

      <Panel title="Search volume">
        <div className="flex h-52 items-end gap-2 px-5 py-6">
          {chart.slice.length === 0 ? (
            <p className="w-full text-center text-sm text-neutral-500">No searches logged yet.</p>
          ) : (
            chart.slice.map((d) => {
              const height = Math.max(
                d.searches > 0 ? 4 : 0,
                Math.round((d.searches / chart.max) * 176),
              );
              return (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-brand/80"
                    style={{ height }}
                    title={`${d.searches} searches`}
                  />
                  <span className="text-[9px] text-neutral-400">{d.date.slice(5)}</span>
                </div>
              );
            })
          )}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Top searches">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-xs uppercase tracking-wide text-neutral-400">
                  <th className="px-5 py-3 font-semibold">Query</th>
                  <th className="px-3 py-3 font-semibold">Count</th>
                  <th className="px-3 py-3 font-semibold">Avg results</th>
                  <th className="px-3 py-3 font-semibold">Zero hits</th>
                </tr>
              </thead>
              <tbody>
                {summary.topTerms.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-neutral-500">
                      Searches will appear here as customers browse the store.
                    </td>
                  </tr>
                ) : (
                  summary.topTerms.map((term) => (
                    <tr key={term.normalizedQuery} className="border-b border-neutral-50">
                      <td className="px-5 py-3 font-medium text-neutral-900">{term.sampleQuery}</td>
                      <td className="px-3 py-3 text-neutral-600">{term.count}</td>
                      <td className="px-3 py-3 text-neutral-600">
                        {term.avgResultCount ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-neutral-600">{term.zeroResultCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Recent activity">
          <ul className="divide-y divide-neutral-100">
            {summary.recentEvents.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-neutral-500">No recent searches.</li>
            ) : (
              summary.recentEvents.map((event) => (
                <li key={event.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="font-medium text-neutral-900">{event.query}</p>
                    <p className="text-xs text-neutral-500">
                      {event.source} · {event.inputMethod}
                      {event.resultCount !== null ? ` · ${event.resultCount} results` : ""}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-neutral-400">
                    {new Date(event.createdAt).toLocaleString()}
                  </time>
                </li>
              ))
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
