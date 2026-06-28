import { getCurrentStaff, getAnalytics } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader, Panel, StatCard } from "@/components/admin/ui";

export default async function AdminAnalyticsPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "analytics.view")) return <AccessDenied feature="analytics" />;

  const analytics = getAnalytics();
  const maxVisits = Math.max(...analytics.dailyVisits.map((d) => d.visits), 1);

  return (
    <>
      <PageHeader title="Site analytics" subtitle="Storefront visits, page views, and conversion from live traffic tracking." />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total visits" value={analytics.totalVisits.toLocaleString()} accent="bg-brand" />
        <StatCard label="Page views" value={analytics.pageViews.toLocaleString()} accent="bg-neutral-950" />
        <StatCard label="Unique sessions" value={analytics.uniqueSessions.toLocaleString()} accent="bg-blue-600" />
        <StatCard label="Conversion rate" value={`${analytics.conversionRate}%`} accent="bg-emerald-600" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Visits & orders (7 days)">
          <div className="flex h-48 items-end gap-2 px-5 py-6">
            {analytics.dailyVisits.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end gap-0.5">
                  <div className="w-1/2 rounded-t bg-brand/80" style={{ height: `${(d.visits / maxVisits) * 100}%` }} title={`${d.visits} visits`} />
                  <div className="w-1/2 rounded-t bg-neutral-300" style={{ height: `${(d.orders / maxVisits) * 100}%` }} title={`${d.orders} orders`} />
                </div>
                <span className="text-[9px] text-neutral-400">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Top pages">
          <ul className="divide-y divide-neutral-100">
            {analytics.topPages.map((p) => (
              <li key={p.path} className="flex justify-between px-5 py-3 text-sm">
                <span className="font-medium">{p.path}</span>
                <span className="tabular-nums text-neutral-500">{p.views.toLocaleString()} views</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
