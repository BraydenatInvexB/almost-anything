"use client";

import {
  DELIVERY_SIZE_OPTIONS,
  type DeliverySize,
} from "@/lib/delivery/size";
import { ProductFormField } from "@/components/admin/ProductFormField";

/**
 * Shared seller/admin control for listing delivery size.
 * Not shown on the customer product page — only affects checkout + ops.
 */
export function DeliverySizeField({
  value,
  onChange,
  className,
}: {
  value: DeliverySize;
  onChange: (value: DeliverySize) => void;
  className?: string;
}) {
  const selected = DELIVERY_SIZE_OPTIONS.find((o) => o.id === value) ?? DELIVERY_SIZE_OPTIONS[0]!;

  return (
    <ProductFormField
      label="Delivery size"
      hint="Customers only see a short note at checkout for larger items. Drivers use this to pick the right vehicle."
      className={className}
    >
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value as DeliverySize)}
        required
      >
        {DELIVERY_SIZE_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-400">
        e.g. {selected.examples}. Vehicle: {selected.vehicleHint}.
      </p>
    </ProductFormField>
  );
}
