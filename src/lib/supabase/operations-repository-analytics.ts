import type { SiteAnalytics } from "@/lib/admin/operations-types";
import { buildAnalytics } from "@/lib/supabase/operations-mappers";
import { asRow, asRows, tbl } from "@/lib/supabase/operations-repository-shared";

export async function getAnalytics(): Promise<SiteAnalytics> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);
  const from = fromDate.toISOString().slice(0, 10);

  const [{ data: daily }, { data: pages }, { count: orderCount }] = await Promise.all([
    tbl("site_analytics_daily").select("*").gte("date", from).order("date"),
    tbl("site_analytics_pages").select("*"),
    tbl("orders").select("*", { count: "exact", head: true }),
  ]);

  if (!daily?.length) {
    return buildAnalytics([], asRows(pages), orderCount ?? 0);
  }

  return buildAnalytics(asRows(daily), asRows(pages), orderCount ?? 0);
}

export async function recordPageVisit(path: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: dayRow } = await tbl("site_analytics_daily")
    .select("*")
    .eq("date", today)
    .maybeSingle();

  if (dayRow) {
    const row = asRow(dayRow);
    await tbl("site_analytics_daily")
      .update({
        visits: Number(row.visits) + 1,
        page_views: Number(row.page_views ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("date", today);
  } else {
    await tbl("site_analytics_daily").insert({
      date: today,
      visits: 1,
      page_views: 1,
      unique_sessions: 1,
      orders: 0,
    });
  }

  const { data: pageRow } = await tbl("site_analytics_pages")
    .select("*")
    .eq("path", path)
    .maybeSingle();

  if (pageRow) {
    const row = asRow(pageRow);
    await tbl("site_analytics_pages")
      .update({ views: Number(row.views) + 1, updated_at: new Date().toISOString() })
      .eq("path", path);
  } else {
    await tbl("site_analytics_pages").insert({ path, views: 1 });
  }
}
