import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  OPERATIONS_STAGES,
  countOrdersByStatus,
  type OperationsTabId,
} from "@/lib/orders/order-workflow";
import type { AdminOrderSummary } from "@/services/admin/types";
import { cn } from "@/lib/utils/cn";

const FLOW_STEPS = [
  { status: "paid", label: "Payment confirmed" },
  { status: "sourcing", label: "Inbound stock" },
  { status: "purchased", label: "Ready to ship" },
  { status: "shipped", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
] as const;

export function OperationsFlowBar({
  orders,
  activeTab,
}: {
  orders: AdminOrderSummary[];
  activeTab: OperationsTabId;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-950">Order lifecycle</p>
          <p className="mt-1 text-xs text-neutral-500">
            Work left to right — each order should move through one stage at a time.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
        >
          Full order list
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ol className="mt-5 grid gap-3 sm:grid-cols-5">
        {FLOW_STEPS.map((step, index) => {
          const count = countOrdersByStatus(orders, [step.status]);
          const tabForStep: OperationsTabId =
            step.status === "shipped" ? "shipping" : step.status === "delivered" ? "all" : "action";
          const isActive = activeTab === tabForStep && step.status !== "delivered";

          return (
            <li key={step.status} className="relative">
              {index < FLOW_STEPS.length - 1 ? (
                <span className="absolute top-5 right-0 hidden h-px w-3 translate-x-full bg-neutral-200 sm:block" />
              ) : null}
              <Link
                href={`/admin/fulfillment?tab=${tabForStep}`}
                className={cn(
                  "block rounded-xl border px-3 py-3 transition-colors",
                  isActive
                    ? "border-brand bg-brand/5"
                    : "border-neutral-200 bg-neutral-50/80 hover:border-neutral-300",
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                  Step {index + 1}
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{step.label}</p>
                <p className="mt-1 text-lg font-black text-neutral-950">{count}</p>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function operationsTabMeta(tab: OperationsTabId) {
  return OPERATIONS_STAGES.find((stage) => stage.id === tab) ?? OPERATIONS_STAGES[0];
}
