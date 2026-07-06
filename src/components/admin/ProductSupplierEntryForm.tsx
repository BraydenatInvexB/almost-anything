"use client";

import type { ManualSupplierForm } from "@/lib/product/product-manual-suppliers";
import type { SupplierRegion, SupplierTier } from "@/types/supplier-sourcing";
import { ProductFormField as Field } from "@/components/admin/ProductFormField";

export function ProductSupplierEntryForm({
  form,
  onChange,
}: {
  form: ManualSupplierForm;
  onChange: (next: ManualSupplierForm) => void;
}) {
  function set<K extends keyof ManualSupplierForm>(key: K, value: ManualSupplierForm[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Supplier name *" className="sm:col-span-2">
        <input
          className="input"
          value={form.supplierName}
          onChange={(e) => set("supplierName", e.target.value)}
          required
        />
      </Field>
      <Field label="Listing / product title">
        <input
          className="input"
          value={form.listingTitle}
          onChange={(e) => set("listingTitle", e.target.value)}
        />
      </Field>
      <Field label="Listing URL">
        <input
          className="input"
          type="url"
          value={form.supplierUrl}
          onChange={(e) => set("supplierUrl", e.target.value)}
          placeholder="https://…"
        />
      </Field>
      <Field label="Region">
        <select
          className="input"
          value={form.region}
          onChange={(e) => set("region", e.target.value as SupplierRegion)}
        >
          <option value="south_africa">South Africa</option>
          <option value="international">International</option>
          <option value="unknown">Unknown</option>
        </select>
      </Field>
      <Field label="Supplier tier">
        <select
          className="input"
          value={form.tier}
          onChange={(e) => set("tier", e.target.value as SupplierTier)}
        >
          <option value="manufacturer">Manufacturer</option>
          <option value="wholesale">Wholesale</option>
          <option value="trade">Trade</option>
          <option value="distributor">Distributor</option>
          <option value="retail">Retail</option>
        </select>
      </Field>
      <Field label="Wholesale price (ZAR)">
        <input
          className="input"
          type="number"
          min="0"
          step="0.01"
          value={form.wholesalePriceZar}
          onChange={(e) => set("wholesalePriceZar", e.target.value)}
        />
      </Field>
      <Field label="Wholesale price (USD)">
        <input
          className="input"
          type="number"
          min="0"
          step="0.01"
          value={form.wholesalePriceUsd}
          onChange={(e) => set("wholesalePriceUsd", e.target.value)}
        />
      </Field>
      <Field label="MOQ">
        <input
          className="input"
          type="number"
          min="1"
          value={form.moq}
          onChange={(e) => set("moq", e.target.value)}
        />
      </Field>
      <Field label="Lead time min (days)">
        <input
          className="input"
          type="number"
          min="0"
          value={form.leadTimeDaysMin}
          onChange={(e) => set("leadTimeDaysMin", e.target.value)}
        />
      </Field>
      <Field label="Lead time max (days)">
        <input
          className="input"
          type="number"
          min="0"
          value={form.leadTimeDaysMax}
          onChange={(e) => set("leadTimeDaysMax", e.target.value)}
        />
      </Field>
      <Field label="Contact email">
        <input
          className="input"
          type="email"
          value={form.contactEmail}
          onChange={(e) => set("contactEmail", e.target.value)}
        />
      </Field>
      <Field label="Contact phone">
        <input
          className="input"
          value={form.contactPhone}
          onChange={(e) => set("contactPhone", e.target.value)}
        />
      </Field>
      <Field label="City">
        <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
      </Field>
      <Field label="Country">
        <input className="input" value={form.country} onChange={(e) => set("country", e.target.value)} />
      </Field>
      <Field label="Procurement notes" className="sm:col-span-2">
        <textarea
          className="input min-h-[80px] resize-y"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Payment terms, account numbers, SKU refs, warehouse notes…"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm text-neutral-700 sm:col-span-2">
        <input
          type="checkbox"
          checked={form.isPrimary}
          onChange={(e) => set("isPrimary", e.target.checked)}
        />
        Use as primary supplier (syncs to catalog source fields)
      </label>
    </div>
  );
}
