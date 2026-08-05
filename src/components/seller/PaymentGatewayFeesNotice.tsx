import {
  PAYMENT_GATEWAYS,
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
      <p className="text-sm font-semibold text-neutral-900">Payment processing</p>
      <p className="mt-1 text-xs text-neutral-600">
        Published standard fees for payments processed through PayFast and Ozow. These details are only shown in the seller dashboard.
      </p>
      <div className={cn("mt-4 grid gap-3", !compact && "lg:grid-cols-2")}>
        {PAYMENT_GATEWAYS.map((gateway) => (
          <section key={gateway.id} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-neutral-950">{gateway.name}</h3>
                <p className="mt-0.5 text-xs text-neutral-500">{gateway.summary}</p>
              </div>
              <a href={gateway.pricingUrl} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-brand hover:underline">
                Official pricing
              </a>
            </div>
            <dl className="mt-3 divide-y divide-neutral-100">
              {gateway.fees.map((fee) => (
                <div key={fee.label} className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
                  <dt className="text-xs leading-5 text-neutral-600">{fee.label}</dt>
                  <dd className="shrink-0 text-right text-xs font-semibold leading-5 text-neutral-900">{fee.rate}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 border-t border-neutral-100 pt-3 text-[11px] leading-4 text-neutral-500">{gateway.note}</p>
          </section>
        ))}
      </div>
      {showLegal ? (
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">{PAYMENT_GATEWAY_FEES_LEGAL}</p>
      ) : null}
    </div>
  );
}
