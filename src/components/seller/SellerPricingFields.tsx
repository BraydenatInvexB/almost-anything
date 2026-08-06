"use client";

import { ProductFormField } from "@/components/admin/ProductFormField";
import { DeliverySizeField } from "@/components/product/DeliverySizeField";
import {
  buildPricingSnapshot,
  type SellerDeliverySettings,
  type SellerShippingContext,
} from "@/lib/seller/product-pricing";
import { formatCurrency } from "@/lib/utils/cn";
import type { DeliverySize } from "@/lib/delivery/size";

export function SellerPricingFields({
  costPrice,
  markupPercent,
  quantity,
  deliveryDaysMin,
  deliveryDaysMax,
  deliverySize,
  delivery,
  shipping,
  onCostChange,
  onMarkupChange,
  onDeliveryDaysChange,
  onDeliverySizeChange,
  onDeliveryChange,
}: {
  costPrice: string;
  markupPercent: string;
  quantity: number;
  deliveryDaysMin: string;
  deliveryDaysMax: string;
  deliverySize: DeliverySize;
  delivery: SellerDeliverySettings;
  shipping: SellerShippingContext;
  onCostChange: (value: string) => void;
  onMarkupChange: (value: string) => void;
  onDeliveryDaysChange: (key: "min" | "max", value: string) => void;
  onDeliverySizeChange: (value: DeliverySize) => void;
  onDeliveryChange: (patch: Partial<SellerDeliverySettings>) => void;
}) {
  const cost = Number(costPrice) || 0;
  const markup = Number(markupPercent) || 0;
  const snapshot = buildPricingSnapshot(cost, markup, delivery, shipping);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-950">Pricing & inventory</h2>
        <p className="mt-0.5 text-xs text-neutral-500">Set your cost and markup. Stock is allocated by fulfilment hub in the next section.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ProductFormField label="Cost price (ZAR)" hint="What you pay or stock at">
            <input className="input" type="number" min="0" step="0.01" value={costPrice} onChange={(e) => onCostChange(e.target.value)} />
          </ProductFormField>
          <ProductFormField label="Markup %" hint={`Platform default ${shipping.defaultMarkupPercent}%`}>
            <input className="input" type="number" min="0" step="0.1" value={markupPercent} onChange={(e) => onMarkupChange(e.target.value)} />
          </ProductFormField>
          <ProductFormField label="Delivery estimate (days)" className="sm:col-span-2">
            <div className="flex gap-2">
              <input className="input" type="number" min="1" value={deliveryDaysMin} onChange={(e) => onDeliveryDaysChange("min", e.target.value)} />
              <input className="input" type="number" min="1" value={deliveryDaysMax} onChange={(e) => onDeliveryDaysChange("max", e.target.value)} />
            </div>
          </ProductFormField>
          <DeliverySizeField
            className="sm:col-span-3"
            value={deliverySize}
            onChange={onDeliverySizeChange}
          />
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-950">Customer delivery</h2>
        <p className="mt-0.5 text-xs text-neutral-500">Choose the delivery fee the customer will pay at checkout.</p>
        <div className="mt-4">
          <ProductFormField label="Delivery option">
            <select
              className="input"
              value={delivery.deliveryFeeZar === 200 ? "200" : "100"}
              onChange={(e) => {
                const fee = Number(e.target.value);
                onDeliveryChange({
                  customerPaysDelivery: true,
                  deliveryFeeZar: fee,
                });
                onDeliverySizeChange(fee === 200 ? "large" : "small");
              }}
            >
              <option value="100">Standard delivery R100</option>
              <option value="200">Big delivery R200</option>
            </select>
          </ProductFormField>
        </div>
      </section>

      <PricingPreview snapshot={snapshot} quantity={quantity} />
      <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs leading-5 text-neutral-600">
        VAT registered sellers must account for VAT at the applicable rate and keep valid tax invoices. Sellers who are not VAT registered must not charge VAT as a separate amount.
      </p>
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
