import {
  formatGatewayFeeTier,
  PAYMENT_GATEWAY_FEE_TIERS,
  PAYMENT_GATEWAY_FEES_LEGAL,
} from "@/config/payment-gateway-fees";
import { cn } from "@/lib/utils/cn";

export function PaymentGatewayFeesNotice({
  compact,
  className,
  showLegal,
}: {
  compact?: boolean;
  className?: string;
  showLegal?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border border-neutral-200 bg-neutral-50/80 p-4", className)}>
      <p className="text-sm font-semibold text-neutral-900">Payment gateway fees (Paystack)</p>
      <p className="mt-1 text-xs text-neutral-600">
        These are the only card processing fees — deducted by Paystack before your payout settles.
      </p>
      <ul className={cn("mt-3 space-y-2", compact && "text-xs")}>
        {PAYMENT_GATEWAY_FEE_TIERS.map((tier) => (
          <li key={tier.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="text-neutral-700">{tier.label}</span>
            <span className="font-semibold text-neutral-900">{formatGatewayFeeTier(tier)}</span>
          </li>
        ))}
      </ul>
      {showLegal ? (
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">{PAYMENT_GATEWAY_FEES_LEGAL}</p>
      ) : null}
    </div>
  );
}
