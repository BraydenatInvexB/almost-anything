import { state } from "@/lib/admin/operations-store-core";

export function getAnalytics() {
  return state.analytics;
}

export function recordPageVisit(path: string) {
  state.analytics.totalVisits += 1;
  state.analytics.pageViews += 1;
  const page = state.analytics.topPages.find((p) => p.path === path);
  if (page) page.views += 1;
  else state.analytics.topPages.push({ path, views: 1 });
  state.analytics.topPages.sort((a, b) => b.views - a.views);
  const today = new Date().toISOString().slice(0, 10);
  const day = state.analytics.dailyVisits.find((d) => d.date === today);
  if (day) day.visits += 1;
}
