import { Truck } from "lucide-react";
import type { FinanceDashboardData } from "@/lib/admin/finance-types";
import {
  Panel,
  StatCard,
  Table,
  Th,
  Td,
} from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import { FinancePlRow } from "@/components/admin/finance-dashboard-shared";

export function FinanceShippingTab({ data }: { data: FinanceDashboardData }) {
  const { summary } = data;
  const cur = summary.currency;

  return (
    <>
      <StatCard
        label="Total internal courier cost"
        value={formatCurrency(summary.shippingCosts, cur)}
        icon={<Truck className="h-4 w-4" />}
        accent="bg-neutral-800"
        hint="Embedded in product prices where configured — tracked here for margin analysis"
      />
      <Panel title="Cost by courier" description="Internal logistics cost vs customer charge">
        <Table>
          <thead>
            <tr>
              <Th>Courier</Th>
              <Th>Shipments</Th>
              <Th>Customer charge</Th>
              <Th className="text-right">Internal cost</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {summary.courierCosts.map((c) => (
              <tr key={c.courier}>
                <Td className="font-medium">{c.courier}</Td>
                <Td>{c.shipments}</Td>
                <Td className="text-emerald-600">
                  {c.customerCharge === 0 ? "Free (embedded)" : formatCurrency(c.customerCharge, cur)}
                </Td>
                <Td className="text-right font-semibold text-red-600">
                  {formatCurrency(c.internalCost, cur)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}

export function FinanceTaxTab({ data }: { data: FinanceDashboardData }) {
  const { summary } = data;
  const cur = summary.currency;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="VAT collected"
          value={formatCurrency(summary.vatCollected, cur)}
          accent="bg-brand"
          hint={`${(summary.vatRate * 100).toFixed(0)}% rate on taxable sales`}
        />
        <StatCard
          label="Taxable revenue (ex VAT)"
          value={formatCurrency(summary.grossRevenue - summary.vatCollected, cur)}
          accent="bg-neutral-800"
        />
        <StatCard
          label="Net revenue (after refunds)"
          value={formatCurrency(summary.netRevenue, cur)}
          accent="bg-emerald-600"
        />
      </div>
      <Panel title="VAT summary" description="South African VAT reporting basis">
        <dl className="divide-y divide-neutral-100 px-5">
          <FinancePlRow label="Gross sales (incl. VAT)" value={formatCurrency(summary.grossRevenue, cur)} />
          <FinancePlRow label="Output VAT collected" value={formatCurrency(summary.vatCollected, cur)} bold />
          <FinancePlRow label="Refunds (reduce taxable base)" value={`−${formatCurrency(summary.refundsIssued, cur)}`} negative />
          <FinancePlRow
            label="Estimated VAT liability"
            value={formatCurrency(summary.vatCollected * 0.92, cur)}
            bold
            highlight
          />
        </dl>
        <p className="border-t border-neutral-100 px-5 py-3 text-xs text-neutral-400">
          Consult your accountant before filing. Input VAT on expenses is not auto-calculated in demo mode.
        </p>
      </Panel>
    </>
  );
}
