"use client";

import { ProductFormField } from "@/components/admin/ProductFormField";
import { SA_WAREHOUSE_DELIVERY_DAYS } from "@/config/delivery";
import {
  buildPricingSnapshot,
  type SellerDeliverySettings,
  type SellerShippingContext,
} from "@/lib/seller/product-pricing";
import { formatCurrency } from "@/lib/utils/cn";

export function SellerPricingFields({
  costPrice,
  markupPercent,
  quantity,
  deliveryDaysMin,
  deliveryDaysMax,
  delivery,
  shipping,
  onCostChange,
  onMarkupChange,
  onQuantityChange,
  onDeliveryDaysChange,
  onDeliveryChange,
}: {
  costPrice: string;
  markupPercent: string;
  quantity: string;
  deliveryDaysMin: string;
  deliveryDaysMax: string;
  delivery: SellerDeliverySettings;
  shipping: SellerShippingContext;
  onCostChange: (value: string) => void;
  onMarkupChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onDeliveryDaysChange: (key: "min" | "max", value: string) => void;
  onDeliveryChange: (patch: Partial<SellerDeliverySettings>) => void;
}) {
  const cost = Number(costPrice) || 0;
  const markup = Number(markupPercent) || 0;
  const snapshot = buildPricingSnapshot(cost, markup, delivery, shipping);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-950">Pricing & inventory</h2>
        <p className="mt-0.5 text-xs text-neutral-500">Set your cost, markup, and stock — retail price is calculated automatically.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <ProductFormField label="Cost price (ZAR)" hint="What you pay or stock at">
            <input className="input" type="number" min="0" step="0.01" value={costPrice} onChange={(e) => onCostChange(e.target.value)} />
          </ProductFormField>
          <ProductFormField label="Markup %" hint={`Platform default ${shipping.defaultMarkupPercent}%`}>
            <input className="input" type="number" min="0" step="0.1" value={markupPercent} onChange={(e) => onMarkupChange(e.target.value)} />
          </ProductFormField>
          <ProductFormField label="Stock quantity">
            <input className="input" type="number" min="0" step="1" value={quantity} onChange={(e) => onQuantityChange(e.target.value)} />
          </ProductFormField>
          <ProductFormField label="Delivery estimate (days)" className="sm:col-span-2">
            <div className="flex gap-2">
              <input className="input" type="number" min="1" value={deliveryDaysMin} onChange={(e) => onDeliveryDaysChange("min", e.target.value)} />
              <input className="input" type="number" min="1" value={deliveryDaysMax} onChange={(e) => onDeliveryDaysChange("max", e.target.value)} />
            </div>
          </ProductFormField>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-950">Customer delivery</h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          Platform default shipping is {formatCurrency(shipping.flatShippingFee, "ZAR")} (free over {formatCurrency(shipping.freeShippingThreshold, "ZAR")}).
        </p>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={delivery.customerPaysDelivery}
              onChange={(e) => onDeliveryChange({ customerPaysDelivery: e.target.checked })}
            />
            Customer pays delivery fee at checkout
          </label>
          {delivery.customerPaysDelivery ? (
            <ProductFormField label="Delivery fee override (ZAR)" hint="Leave blank to use platform default">
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder={String(shipping.flatShippingFee)}
                value={delivery.deliveryFeeZar ?? ""}
                onChange={(e) =>
                  onDeliveryChange({
                    deliveryFeeZar: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </ProductFormField>
          ) : null}
        </div>
      </section>

      <PricingPreview snapshot={snapshot} quantity={Number(quantity) || 0} />
    </div>
  );
}

function PricingPreview({
  snapshot,
  quantity,
}: {
  snapshot: ReturnType<typeof buildPricingSnapshot>;
  quantity: number;
}) {
  return (
    <div className="rounded-xl border border-brand/20 bg-brand/[0.03] p-5">
      <h3 className="text-sm font-semibold text-neutral-950">Margin preview</h3>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PreviewItem label="Retail price" value={formatCurrency(snapshot.retailPrice, "ZAR")} />
        <PreviewItem label="Your margin" value={`${formatCurrency(snapshot.marginAmount, "ZAR")} (${snapshot.marginPercent}%)`} accent />
        <PreviewItem label="Customer delivery" value={snapshot.deliveryLabel} />
        <PreviewItem label="Customer pays" value={formatCurrency(snapshot.customerPaysTotal, "ZAR")} />
      </dl>
      {quantity > 0 ? (
        <p className="mt-3 text-xs text-neutral-500">
          If all {quantity} units sell: {formatCurrency(snapshot.marginAmount * quantity, "ZAR")} total margin before fees.
        </p>
      ) : null}
    </div>
  );
}

function PreviewItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{label}</dt>
      <dd className={accent ? "mt-1 text-sm font-semibold text-emerald-700" : "mt-1 text-sm font-semibold text-neutral-900"}>{value}</dd>
    </div>
  );
}
