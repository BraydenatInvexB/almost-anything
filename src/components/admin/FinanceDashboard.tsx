"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FinanceDashboardData } from "@/lib/admin/finance-types";
import { cn } from "@/lib/utils/cn";
import type { StaffProfile } from "@/types/staff-access";
import { FINANCE_TABS, type FinanceTab } from "@/components/admin/finance-dashboard-shared";
import { FinanceOverviewTab } from "@/components/admin/FinanceOverviewTab";
import { FinanceRevenueTab } from "@/components/admin/FinanceRevenueTab";
import { FinanceExpensesTab } from "@/components/admin/FinanceExpensesTab";
import { FinancePayablesTab } from "@/components/admin/FinancePayablesTab";
import { FinanceRefundsTab } from "@/components/admin/FinanceRefundsTab";
import { FinanceShippingTab, FinanceTaxTab } from "@/components/admin/FinanceMiscTabs";

export function FinanceDashboard({
  data,
  canManage,
  canManageReturns,
  agents = [],
}: {
  data: FinanceDashboardData;
  canManage: boolean;
  canManageReturns?: boolean;
  agents?: StaffProfile[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as FinanceTab | null;
  const [tab, setTab] = useState<FinanceTab>(
    tabParam && FINANCE_TABS.some((t) => t.id === tabParam) ? tabParam : "overview",
  );

  useEffect(() => {
    if (tabParam && FINANCE_TABS.some((t) => t.id === tabParam)) {
      setTab(tabParam);
    }
  }, [tabParam]);

  function selectTab(id: FinanceTab) {
    setTab(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id === "overview") params.delete("tab");
    else params.set("tab", id);
    const qs = params.toString();
    router.replace(qs ? `/admin/finance?${qs}` : "/admin/finance", { scroll: false });
  }

  const cur = data.summary.currency;
  const returnsManage = canManageReturns ?? canManage;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
        {FINANCE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <FinanceOverviewTab data={data} onSelectTab={selectTab} />
      )}

      {tab === "revenue" && <FinanceRevenueTab data={data} />}

      {tab === "expenses" && (
        <FinanceExpensesTab expenses={data.expenses} canManage={canManage} currency={cur} />
      )}

      {tab === "payables" && (
        <FinancePayablesTab payables={data.payables} canManage={canManage} currency={cur} />
      )}

      {tab === "refunds" && (
        <FinanceRefundsTab data={data} canManage={returnsManage} agents={agents} />
      )}

      {tab === "shipping" && <FinanceShippingTab data={data} />}

      {tab === "tax" && <FinanceTaxTab data={data} />}
    </div>
  );
}
