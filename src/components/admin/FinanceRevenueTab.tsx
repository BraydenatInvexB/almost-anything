import Link from "next/link";
import type { FinanceDashboardData } from "@/lib/admin/finance-types";
import {
  Panel,
  StatCard,
  StatusBadge,
  Table,
  Th,
  Td,
} from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";

export function FinanceRevenueTab({ data }: { data: FinanceDashboardData }) {
  const { summary } = data;
  const cur = summary.currency;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Gross revenue" value={formatCurrency(summary.grossRevenue, cur)} accent="bg-brand" />
        <StatCard label="Orders" value={String(summary.orderCount)} accent="bg-neutral-800" />
        <StatCard
          label="Avg order value"
          value={formatCurrency(summary.avgOrderValue, cur)}
          accent="bg-emerald-600"
        />
      </div>

      <Panel title="Revenue by payment method">
        <Table>
          <thead>
            <tr>
              <Th>Method</Th>
              <Th>Orders</Th>
              <Th>Share</Th>
              <Th className="text-right">Amount</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {summary.revenueByPayment.map((p) => (
              <tr key={p.method}>
                <Td className="font-medium">{p.method}</Td>
                <Td>{p.count}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${p.sharePct}%` }} />
                    </div>
                    <span className="text-xs text-neutral-500">{p.sharePct}%</span>
                  </div>
                </Td>
                <Td className="text-right font-semibold">{formatCurrency(p.amount, cur)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <Panel title="Recent order payments">
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Payment</Th>
              <Th>Status</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {data.recentOrders.map((o) => (
              <tr key={o.id}>
                <Td>
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-brand">
                    {o.orderNumber}
                  </Link>
                </Td>
                <Td>{o.customerName}</Td>
                <Td className="text-neutral-600">{o.paymentMethod ?? "—"}</Td>
                <Td><StatusBadge status={o.status} /></Td>
                <Td className="text-right font-semibold">{formatCurrency(o.total, cur)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
