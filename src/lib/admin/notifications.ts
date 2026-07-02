export type AdminNotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  count: number;
};

export type AdminNotificationSummary = {
  total: number;
  items: AdminNotificationItem[];
};

export function notificationTotal(items: AdminNotificationItem[]): number {
  return items.reduce((sum, item) => sum + item.count, 0);
}
