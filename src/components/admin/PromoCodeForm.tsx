"use client";

import { useState } from "react";
import type { Product } from "@/types/database";
import type { PromoCode, PromoScope } from "@/lib/admin/operations-types";
import { STORE_CATEGORIES } from "@/config/categories";
import { BtnPrimary } from "@/components/admin/ui";

export interface PromoCodeFormState {
  code: string;
  label: string;
  status: PromoCode["status"];
  discountType: PromoCode["discountType"];
  discountValue: string;
  scope: PromoScope;
  productIds: string[];
  categorySlugs: string[];
  minOrderAmount: string;
  maxDiscountAmount: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
}

export const EMPTY_PROMO_FORM: PromoCodeFormState = {
  code: "",
  label: "",
  status: "draft",
  discountType: "percent",
  discountValue: "",
  scope: "all",
  productIds: [],
  categorySlugs: [],
  minOrderAmount: "",
  maxDiscountAmount: "",
  startsAt: "",
  endsAt: "",
  usageLimit: "",
};

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function PromoCodeForm({
  products,
  initial = EMPTY_PROMO_FORM,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  products: Product[];
  initial?: PromoCodeFormState;
  submitLabel: string;
  onSubmit: (form: PromoCodeFormState) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <input
        className="input"
        placeholder="Code e.g. SUMMER25"
        value={form.code}
        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
        required
      />
      <input
        className="input"
        placeholder="Label (optional)"
        value={form.label}
        onChange={(e) => setForm({ ...form, label: e.target.value })}
      />
      <select
        className="input"
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value as PromoCode["status"] })}
      >
        <option value="draft">Draft</option>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="expired">Expired</option>
      </select>
      <select
        className="input"
        value={form.discountType}
        onChange={(e) =>
          setForm({ ...form, discountType: e.target.value as PromoCode["discountType"] })
        }
      >
        <option value="percent">Percent off</option>
        <option value="fixed">Fixed amount off (ZAR)</option>
      </select>
      <input
        className="input"
        type="number"
        min="0"
        step="0.01"
        placeholder={form.discountType === "percent" ? "Discount %" : "Amount off"}
        value={form.discountValue}
        onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
        required
      />
      <select
        className="input"
        value={form.scope}
        onChange={(e) => setForm({ ...form, scope: e.target.value as PromoScope })}
      >
        <option value="all">All products</option>
        <option value="products">Specific products</option>
        <option value="categories">Specific categories</option>
      </select>
      <input
        className="input"
        type="number"
        min="0"
        placeholder="Min order amount (optional)"
        value={form.minOrderAmount}
        onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
      />
      <input
        className="input"
        type="number"
        min="0"
        placeholder="Max discount cap (optional)"
        value={form.maxDiscountAmount}
        onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
      />
      <input
        className="input"
        type="date"
        value={form.startsAt}
        onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
      />
      <input
        className="input"
        type="date"
        value={form.endsAt}
        onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
      />
      <input
        className="input sm:col-span-2"
        type="number"
        min="1"
        placeholder="Usage limit (optional)"
        value={form.usageLimit}
        onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
      />

      {form.scope === "products" ? (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-200 p-3 sm:col-span-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Select products
          </p>
          <div className="grid gap-1 sm:grid-cols-2">
            {products.slice(0, 40).map((product) => (
              <label key={product.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.productIds.includes(product.id)}
                  onChange={() =>
                    setForm({ ...form, productIds: toggleValue(form.productIds, product.id) })
                  }
                />
                <span className="truncate">{product.name}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {form.scope === "categories" ? (
        <div className="rounded-lg border border-neutral-200 p-3 sm:col-span-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Select categories
          </p>
          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {STORE_CATEGORIES.map((category) => (
              <label key={category.slug} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.categorySlugs.includes(category.slug)}
                  onChange={() =>
                    setForm({
                      ...form,
                      categorySlugs: toggleValue(form.categorySlugs, category.slug),
                    })
                  }
                />
                {category.label}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex gap-2 sm:col-span-2">
        <BtnPrimary type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </BtnPrimary>
        <button type="button" onClick={onCancel} className="text-sm text-neutral-500">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function promoFormToPayload(form: PromoCodeFormState) {
  return {
    code: form.code,
    label: form.label || undefined,
    status: form.status,
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    scope: form.scope,
    productIds: form.scope === "products" ? form.productIds : [],
    categorySlugs: form.scope === "categories" ? form.categorySlugs : [],
    minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
    maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
    usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
  };
}

export function promoToFormState(promo: PromoCode): PromoCodeFormState {
  return {
    code: promo.code,
    label: promo.label ?? "",
    status: promo.status,
    discountType: promo.discountType,
    discountValue: String(promo.discountValue),
    scope: promo.scope,
    productIds: promo.productIds,
    categorySlugs: promo.categorySlugs,
    minOrderAmount: promo.minOrderAmount != null ? String(promo.minOrderAmount) : "",
    maxDiscountAmount: promo.maxDiscountAmount != null ? String(promo.maxDiscountAmount) : "",
    startsAt: promo.startsAt ? promo.startsAt.slice(0, 10) : "",
    endsAt: promo.endsAt ? promo.endsAt.slice(0, 10) : "",
    usageLimit: promo.usageLimit != null ? String(promo.usageLimit) : "",
  };
}
