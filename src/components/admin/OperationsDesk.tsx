"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { Panel } from "@/components/admin/ui";
import type { CourierSelectOption } from "@/components/admin/CarrierSelect";
import {
  OPERATIONS_STAGES,
  filterOrdersForTab,
  stageCountLabel,
  type OperationsTabId,
} from "@/lib/orders/order-workflow";
import type { AdminOrderSummary } from "@/services/admin/types";
import { cn } from "@/lib/utils/cn";

export function OperationsDesk({
  orders,
  couriers,
  canManage,
  initialTab = "action",
}: {
  orders: AdminOrderSummary[];
  couriers: CourierSelectOption[];
  canManage: boolean;
  initialTab?: OperationsTabId;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<OperationsTabId>(initialTab);

  const filtered = useMemo(() => filterOrdersForTab(orders, tab), [orders, tab]);
  const stage = OPERATIONS_STAGES.find((s) => s.id === tab) ?? OPERATIONS_STAGES[0];

  function selectTab(next: OperationsTabId) {
    setTab(next);
    router.replace(`/admin/fulfillment?tab=${next}`, { scroll: false });
  }

  return (
    <Panel clip>
      <div className="border-b border-neutral-100 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-950">Operations queue</h2>
            <p className="mt-1 text-sm text-neutral-500">{stage.description}</p>
          </div>
          <p className="text-xs font-medium text-neutral-500">{stageCountLabel(tab, filtered.length)}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {OPERATIONS_STAGES.map((item) => {
            const count = filterOrdersForTab(orders, item.id).length;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  tab === item.id
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
                )}
              >
                {item.label}
                <span className="ml-1.5 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-neutral-700">Nothing in this queue right now.</p>
          <p className="mt-1 text-xs text-neutral-500">
            Switch tabs to see shipped orders, or view completed orders in the full list.
          </p>
          <Link
            href="/admin/orders?status=delivered"
            className="mt-4 inline-flex text-sm font-semibold text-brand hover:underline"
          >
            View delivered orders →
          </Link>
        </div>
      ) : (
        <OrdersTable orders={filtered} canManage={canManage} couriers={couriers} showNextStep />
      )}
    </Panel>
  );
}
