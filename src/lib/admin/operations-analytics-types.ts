export interface SiteAnalytics {
  totalVisits: number;
  uniqueSessions: number;
  pageViews: number;
  conversionRate: number;
  dailyVisits: { date: string; visits: number; orders: number }[];
  topPages: { path: string; views: number }[];
}
