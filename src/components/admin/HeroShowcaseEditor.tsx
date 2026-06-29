"use client";

import { Plus, Trash2 } from "lucide-react";
import { ProductImageField } from "@/components/admin/ProductImageField";
import type {
  HeroShowcaseConfig,
  HeroShowcaseItem,
  HeroSticker,
  HeroStickerColor,
  HeroStickerRotate,
} from "@/lib/admin/operations-types";

interface HeroShowcaseEditorProps {
  value: HeroShowcaseConfig;
  onChange: (value: HeroShowcaseConfig) => void;
  disabled?: boolean;
  currency?: string;
}

function newItem(currency: string): HeroShowcaseItem {
  return {
    id: `hero-${Date.now()}`,
    searchQuery: "",
    name: "",
    price: 0,
    currency,
    deliveryDays: "3 to 5",
    imageUrl: "",
    inStock: true,
    stockLabel: "In stock",
  };
}

function newSticker(): HeroSticker {
  return {
    id: `sticker-${Date.now()}`,
    label: "New badge",
    color: "brand",
    rotate: "left",
  };
}

export function HeroShowcaseEditor({
  value,
  onChange,
  disabled,
  currency = "ZAR",
}: HeroShowcaseEditorProps) {
  function updateItem(id: string, patch: Partial<HeroShowcaseItem>) {
    onChange({
      ...value,
      items: value.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  function removeItem(id: string) {
    if (value.items.length <= 1) return;
    onChange({ ...value, items: value.items.filter((item) => item.id !== id) });
  }

  function updateSticker(id: string, patch: Partial<HeroSticker>) {
    onChange({
      ...value,
      stickers: value.stickers.map((sticker) =>
        sticker.id === id ? { ...sticker, ...patch } : sticker,
      ),
    });
  }

  function removeSticker(id: string) {
    onChange({ ...value, stickers: value.stickers.filter((sticker) => sticker.id !== id) });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Red panel heading">
          <input
            disabled={disabled}
            value={value.panelLabel}
            onChange={(e) => onChange({ ...value, panelLabel: e.target.value })}
            className="input disabled:opacity-60"
            placeholder="Just found for shoppers"
          />
        </Field>
        <Field label="Buy button label">
          <input
            disabled={disabled}
            value={value.buyButtonLabel}
            onChange={(e) => onChange({ ...value, buyButtonLabel: e.target.value })}
            className="input disabled:opacity-60"
            placeholder="Buy it now"
          />
        </Field>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Showcase products</p>
            <p className="text-xs text-neutral-500">
              These rotate in the homepage hero — search text, image, price, and delivery.
            </p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...value, items: [...value.items, newItem(currency)] })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add item
          </button>
        </div>

        <div className="space-y-4">
          {value.items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-neutral-900">Item {index + 1}</p>
                <button
                  type="button"
                  disabled={disabled || value.items.length <= 1}
                  onClick={() => removeItem(item.id)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Typed search text">
                  <input
                    disabled={disabled}
                    value={item.searchQuery}
                    onChange={(e) => updateItem(item.id, { searchQuery: e.target.value })}
                    className="input disabled:opacity-60"
                    placeholder="louis vuitton neverfull"
                  />
                </Field>
                <Field label="Product name">
                  <input
                    disabled={disabled}
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
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
                    onChange={(e) => updateItem(item.id, { price: Number(e.target.value) })}
                    className="input disabled:opacity-60"
                  />
                </Field>
                <Field label="Delivery (days)">
                  <input
                    disabled={disabled}
                    value={item.deliveryDays}
                    onChange={(e) => updateItem(item.id, { deliveryDays: e.target.value })}
                    className="input disabled:opacity-60"
                    placeholder="3 to 5"
                  />
                </Field>
                <Field label="Stock label">
                  <input
                    disabled={disabled}
                    value={item.stockLabel ?? ""}
                    onChange={(e) => updateItem(item.id, { stockLabel: e.target.value })}
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
                      onChange={(e) => updateItem(item.id, { inStock: e.target.checked })}
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                    Show as available
                  </label>
                </Field>
              </div>

              <div className="mt-4">
                <ProductImageField
                  value={item.imageUrl}
                  onChange={(url) => updateItem(item.id, { imageUrl: url })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Hero badges</p>
            <p className="text-xs text-neutral-500">Sticker labels under the search box on the left.</p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...value, stickers: [...value.stickers, newSticker()] })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add badge
          </button>
        </div>

        <div className="space-y-3">
          {value.stickers.map((sticker) => (
            <div
              key={sticker.id}
              className="grid gap-3 rounded-xl border border-neutral-200 bg-white p-3 sm:grid-cols-[1fr_140px_140px_auto]"
            >
              <input
                disabled={disabled}
                value={sticker.label}
                onChange={(e) => updateSticker(sticker.id, { label: e.target.value })}
                className="input disabled:opacity-60"
                placeholder="Badge label"
              />
              <select
                disabled={disabled}
                value={sticker.color}
                onChange={(e) =>
                  updateSticker(sticker.id, { color: e.target.value as HeroStickerColor })
                }
                className="input disabled:opacity-60"
              >
                <option value="brand">Brand red</option>
                <option value="blue">Blue</option>
                <option value="purple">Purple</option>
                <option value="green">Green</option>
              </select>
              <select
                disabled={disabled}
                value={sticker.rotate}
                onChange={(e) =>
                  updateSticker(sticker.id, { rotate: e.target.value as HeroStickerRotate })
                }
                className="input disabled:opacity-60"
              >
                <option value="left">Tilt left</option>
                <option value="right">Tilt right</option>
                <option value="none">Straight</option>
              </select>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeSticker(sticker.id)}
                className="inline-flex items-center justify-center text-red-600 disabled:opacity-40"
                aria-label="Remove badge"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
      {children}
    </label>
  );
}
