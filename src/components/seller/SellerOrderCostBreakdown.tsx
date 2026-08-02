import { formatCurrency } from "@/lib/utils/cn";
import type { SellerOrderSummary } from "@/services/seller/orders";

/** Goods / delivery / tax / total breakdown for a seller order. */
export function SellerOrderCostBreakdown({
  order,
}: {
  order: SellerOrderSummary;
}) {
  const c = order.currency || "ZAR";
  const multiStore = order.goodsSubtotal < order.orderSubtotal - 0.01;

  return (
    <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-3 text-sm">
      <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
        Cost breakdown
      </p>
      <dl className="mt-2 space-y-1.5">
        <Row
          label={multiStore ? "Your goods" : "Goods"}
          value={formatCurrency(order.goodsSubtotal, c)}
          strong
        />
        {multiStore ? (
          <Row
            label="Full order goods"
            value={formatCurrency(order.orderSubtotal, c)}
            muted
          />
        ) : null}
        <Row
          label={
            order.isSellerDelivery
              ? "Delivery fee (you deliver)"
              : order.deliveryFee > 0
                ? "Delivery fee (Almost Anything)"
                : "Delivery fee"
          }
          value={
            order.deliveryFee > 0
              ? formatCurrency(order.deliveryFee, c)
              : "Free / included"
          }
        />
        {order.tax > 0 ? (
          <Row label="VAT" value={formatCurrency(order.tax, c)} muted />
        ) : null}
        <div className="border-t border-neutral-200 pt-1.5">
          <Row
            label="Customer paid"
            value={formatCurrency(order.orderTotal, c)}
            strong
          />
        </div>
      </dl>
      {order.isSellerDelivery && order.deliveryFee > 0 ? (
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          Customer paid {formatCurrency(order.deliveryFee, c)} delivery on top of your goods
          ({formatCurrency(order.goodsSubtotal, c)}).
        </p>
      ) : null}
      {!order.isSellerDelivery && order.delivery?.mode === "platform_driver" ? (
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          Almost Anything collects and delivers this order. Delivery fee is not paid to your shop.
        </p>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={muted ? "text-neutral-400" : "text-neutral-600"}>{label}</dt>
      <dd
        className={
          strong
            ? "font-semibold tabular-nums text-neutral-900"
            : muted
              ? "tabular-nums text-neutral-400"
              : "tabular-nums text-neutral-800"
        }
      >
        {value}
      </dd>
    </div>
  );
}
