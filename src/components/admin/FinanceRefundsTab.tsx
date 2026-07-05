import type { FinanceDashboardData } from "@/lib/admin/finance-types";
import { StatCard } from "@/components/admin/ui";
import { ReturnsDesk } from "@/components/admin/ReturnsDesk";
import type { StaffProfile } from "@/types/staff-access";
import { formatCurrency } from "@/lib/utils/cn";

export function FinanceRefundsTab({
  data,
  canManage,
  agents,
}: {
  data: FinanceDashboardData;
  canManage: boolean;
  agents: StaffProfile[];
}) {
  const cur = data.summary.currency;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Refunds processed"
          value={formatCurrency(
            data.returns.filter((r) => r.status === "refunded").reduce((s, r) => s + r.refundAmount, 0),
            cur,
          )}
          accent="bg-red-600"
        />
        <StatCard
          label="Pending refund queue"
          value={String(
            data.returns.filter(
              (r) => r.status === "requested" || r.status === "approved" || r.status === "received",
            ).length,
          )}
          accent="bg-amber-600"
        />
      </div>
      <ReturnsDesk
        returns={data.returns}
        canManage={canManage}
        agents={agents}
        embedded
      />
    </>
  );
}
