import {
  LifeBuoy,
  Package,
  Truck,
  ClipboardList,
} from "lucide-react";
import type { StaffProfile } from "@/types/staff-access";
import type { DashboardStats } from "@/services/admin-service";
import {
  DashboardViewAttention,
  DashboardViewHero,
  DashboardViewKpis,
  type AttentionItem,
} from "@/components/admin/DashboardViewSections";
import {
  DashboardViewBottomGrid,
  DashboardViewCharts,
  DashboardViewQuickActions,
} from "@/components/admin/DashboardViewLowerSections";

interface DashboardViewProps {
  staff: StaffProfile;
  stats: DashboardStats;
  fulfillmentCount: number;
  openItemRequests: number;
  showItemRequests: boolean;
}

export function DashboardView({
  staff,
  stats,
  fulfillmentCount,
  openItemRequests,
  showItemRequests,
}: DashboardViewProps) {
  const today = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const attentionItems: AttentionItem[] = [
    {
      title: "Fulfillment",
      count: fulfillmentCount,
      description: "Orders to process or ship",
      href: "/admin/fulfillment",
      icon: Truck,
      urgent: fulfillmentCount > 0,
      color: "bg-brand",
    },
    ...(showItemRequests
      ? [
          {
            title: "Item requests",
            count: openItemRequests,
            description: "Custom product lookups",
            href: "/admin/requests",
            icon: ClipboardList,
            urgent: openItemRequests > 0,
            color: "bg-violet-600",
          },
        ]
      : []),
    {
      title: "Support",
      count: stats.openTickets,
      description: "Tickets awaiting reply",
      href: "/admin/support",
      icon: LifeBuoy,
      urgent: stats.openTickets > 0,
      color: "bg-amber-500",
    },
    {
      title: "Stock alerts",
      count: stats.lowStock,
      description: "Low or out of stock",
      href: "/admin/products",
      icon: Package,
      urgent: stats.lowStock > 0,
      color: "bg-red-600",
    },
  ].sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.count - a.count);

  const totalAttention = attentionItems.reduce((s, i) => s + i.count, 0);

  return (
    <div className="space-y-6">
      <DashboardViewHero staff={staff} totalAttention={totalAttention} today={today} />
      <DashboardViewAttention items={attentionItems} />
      <DashboardViewKpis stats={stats} />
      <DashboardViewCharts stats={stats} fulfillmentCount={fulfillmentCount} />
      <DashboardViewQuickActions />
      <DashboardViewBottomGrid stats={stats} />
    </div>
  );
}
