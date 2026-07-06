"use client";

import { ProductFormField } from "@/components/admin/ProductFormField";
import { STOCK_ORIGIN_OPTIONS, parseStockOrigin } from "@/lib/product/stock-origin";
import type { StockOrigin } from "@/lib/admin/operations-inventory-types";

export function SellerStockOriginField({
  value,
  onChange,
  hint,
}: {
  value: StockOrigin;
  onChange: (value: StockOrigin) => void;
  hint?: string;
}) {
  const selected = STOCK_ORIGIN_OPTIONS.find((option) => option.value === value);

  return (
    <ProductFormField
      label="Warehouse location"
      hint={hint ?? "Shown on the storefront as SA warehouse or International warehouse."}
      className="sm:col-span-2"
    >
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(parseStockOrigin(e.target.value))}
      >
        {STOCK_ORIGIN_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {selected ? <p className="mt-1.5 text-xs text-neutral-500">{selected.description}</p> : null}
    </ProductFormField>
  );
}
