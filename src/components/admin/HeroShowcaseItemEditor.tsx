"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { ProductImageField } from "@/components/admin/ProductImageField";
import { HeroProductPicker } from "@/components/admin/HeroProductPicker";
import { applyProductToHeroItem } from "@/lib/hero/product-to-showcase";
import type { HeroShowcaseItem } from "@/lib/admin/operations-types";

interface HeroShowcaseItemEditorProps {
  item: HeroShowcaseItem;
  index: number;
  disabled?: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<HeroShowcaseItem>) => void;
  onRemove: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

export function HeroShowcaseItemEditor({
  item,
  index,
  disabled,
  canRemove,
  onChange,
  onRemove,
}: HeroShowcaseItemEditorProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Item {index + 1}</p>
          {item.productSlug ? (
            <p className="text-xs text-neutral-500">
              Linked to{" "}
              <Link
                href={`/admin/products?q=${encodeURIComponent(item.name)}`}
                className="font-medium text-brand hover:underline"
              >
                {item.name}
              </Link>
            </p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={disabled || !canRemove}
          onClick={onRemove}
          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>

      <div className="mb-4 rounded-lg border border-dashed border-neutral-300 bg-white p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Import from catalog
        </p>
        <HeroProductPicker
          disabled={disabled}
          onSelect={(product) => onChange(applyProductToHeroItem(item, product))}
        />
        <p className="mt-2 text-xs text-neutral-500">
          Pulls name, price, image, and delivery from your product list. You can still tweak fields below.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Typed search text">
          <input
            disabled={disabled}
            value={item.searchQuery}
            onChange={(e) => onChange({ searchQuery: e.target.value, productSlug: undefined })}
            className="input disabled:opacity-60"
            placeholder="louis vuitton neverfull"
          />
        </Field>
        <Field label="Product name">
          <input
            disabled={disabled}
            value={item.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="input disabled:opacity-60"
            placeholder="Louis Vuitton Neverfull"
          />
        </Field>
        <Field label="Price">
          <input
            type="number"
            min={0}
            disabled={disabled}
            value={item.price}
            onChange={(e) => onChange({ price: Number(e.target.value) })}
            className="input disabled:opacity-60"
          />
        </Field>
        <Field label="Delivery (days)">
          <input
            disabled={disabled}
            value={item.deliveryDays}
            onChange={(e) => onChange({ deliveryDays: e.target.value })}
            className="input disabled:opacity-60"
            placeholder="3 to 5"
          />
        </Field>
        <Field label="Stock label">
          <input
            disabled={disabled}
            value={item.stockLabel ?? ""}
            onChange={(e) => onChange({ stockLabel: e.target.value })}
            className="input disabled:opacity-60"
            placeholder="In stock"
          />
        </Field>
        <Field label="In stock">
          <label className="flex h-10 items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              disabled={disabled}
              checked={item.inStock}
              onChange={(e) => onChange({ inStock: e.target.checked })}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Show as available
          </label>
        </Field>
      </div>

      <div className="mt-4">
        <ProductImageField
          value={item.imageUrl ? [item.imageUrl] : []}
          onChange={(urls) => onChange({ imageUrl: urls[0] ?? "" })}
        />
      </div>
    </div>
  );
}
