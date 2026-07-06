import { Card } from "@/components/ui/Card";
import type { SellerPayout } from "@/types/seller";

export function SellerAdminPayoutsTab({ payouts }: { payouts: SellerPayout[] }) {
  return (
    <Card variant="elevated" className="p-6">
      <h2 className="text-lg font-semibold">Payout requests</h2>
      <ul className="mt-4 space-y-2">
        {payouts.map((payout) => (
          <li key={payout.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3 text-sm">
            <span>R{payout.amount.toFixed(2)}</span>
            <span className="capitalize">{payout.status}</span>
          </li>
        ))}
        {!payouts.length ? <p className="text-sm text-neutral-500">No payout requests yet.</p> : null}
      </ul>
    </Card>
  );
}
