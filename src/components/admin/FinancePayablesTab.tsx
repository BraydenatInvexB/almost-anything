"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SupplierPayable } from "@/lib/admin/finance-types";
import {
  Panel,
  StatCard,
  StatusBadge,
  Table,
  Th,
  Td,
  EmptyState,
} from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";

export function FinancePayablesTab({
  payables,
  canManage,
  currency,
}: {
  payables: SupplierPayable[];
  canManage: boolean;
  currency: string;
}) {
  const router = useRouter();
  const pending = payables.filter((p) => p.status !== "paid" && p.status !== "cancelled");
  const totalPending = pending.reduce((s, p) => s + p.amount, 0);

  async function markPaid(id: string) {
    await fetch("/api/admin/finance/payables", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "paid" }),
    });
    router.refresh();
  }

  async function approve(id: string) {
    await fetch("/api/admin/finance/payables", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "approved" }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Outstanding payables" value={formatCurrency(totalPending, currency)} accent="bg-amber-600" />
        <StatCard
          label="Overdue"
          value={formatCurrency(
            payables.filter((p) => p.status === "overdue").reduce((s, p) => s + p.amount, 0),
            currency,
          )}
          accent="bg-red-600"
        />
      </div>
      <Panel title="Supplier invoices & payables">
        {payables.length === 0 ? (
          <EmptyState
            title="No payables on file"
            description="Supplier invoices and outstanding payables will appear here."
          />
        ) : (
        <Table>
          <thead>
            <tr>
              <Th>Invoice</Th>
              <Th>Vendor</Th>
              <Th>Due</Th>
              <Th>Order</Th>
              <Th>Status</Th>
              <Th className="text-right">Amount</Th>
              {canManage && <Th />}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {payables.map((p) => (
              <tr key={p.id}>
                <Td className="font-mono text-xs">{p.invoiceNumber}</Td>
                <Td className="font-medium">{p.vendor}</Td>
                <Td className={p.status === "overdue" ? "font-semibold text-red-600" : "text-neutral-500"}>
                  {new Date(p.dueDate).toLocaleDateString("en-ZA")}
                </Td>
                <Td>
                  {p.orderNumber ? (
                    <Link href={`/admin/orders/${p.orderId ?? ""}`} className="text-brand hover:underline">
                      {p.orderNumber}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td><StatusBadge status={p.status} /></Td>
                <Td className="text-right font-semibold">{formatCurrency(p.amount, p.currency)}</Td>
                {canManage && (
                  <Td>
                    <div className="flex justify-end gap-2">
                      {p.status === "pending" && (
                        <button type="button" onClick={() => approve(p.id)} className="text-xs font-semibold text-brand">
                          Approve
                        </button>
                      )}
                      {(p.status === "approved" || p.status === "overdue") && (
                        <button type="button" onClick={() => markPaid(p.id)} className="text-xs font-semibold text-emerald-600">
                          Mark paid
                        </button>
                      )}
                    </div>
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
        )}
      </Panel>
    </>
  );
}
