import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/cn";

export function PaymentSummaryCard({
  rows,
  totalLabel,
  total,
  currency = "ZAR",
}: {
  rows: { label: string; value: string }[];
  totalLabel: string;
  total: number;
  currency?: string;
}) {
  return (
    <Card variant="default" className="bg-neutral-50 p-5">
      <dl className="space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-neutral-500">{row.label}</dt>
            <dd className="text-right font-medium text-neutral-900">{row.value}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold">
          <dt>{totalLabel}</dt>
          <dd>{formatCurrency(total, currency)}</dd>
        </div>
      </dl>
    </Card>
  );
}
