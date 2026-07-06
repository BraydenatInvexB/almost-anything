"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { ProductSupplierIntel, SupplierListing } from "@/types/supplier-sourcing";
import { ProductSupplierCard, ProductSupplierResearchNotes } from "@/components/admin/ProductSupplierCard";
import { ProductSupplierEntryForm } from "@/components/admin/ProductSupplierEntryForm";
import {
  EMPTY_SUPPLIER_FORM,
  formToListing,
  listingToForm,
  normalizeManualSuppliers,
} from "@/lib/product/product-manual-suppliers";
import { formatCurrency } from "@/lib/utils/cn";
import { BtnPrimary } from "@/components/admin/ui";

type Props = {
  suppliers: SupplierListing[];
  onChange: (suppliers: SupplierListing[]) => void;
  supplierIntel?: ProductSupplierIntel;
  basePrice?: number;
  updatedAt?: string;
};

export function ProductSupplierEditor({
  suppliers,
  onChange,
  supplierIntel,
  basePrice,
  updatedAt,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_SUPPLIER_FORM);

  const normalized = normalizeManualSuppliers(suppliers);
  const editingListing = editingId ? normalized.find((item) => item.id === editingId) : null;

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_SUPPLIER_FORM, isPrimary: normalized.length === 0 });
    setShowForm(true);
  }

  function openEdit(listing: SupplierListing) {
    setEditingId(listing.id);
    setForm(listingToForm(listing));
    setShowForm(true);
  }

  function saveSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!form.supplierName.trim()) return;

    const listing = formToListing(form, editingId ?? undefined);
    let next = editingId
      ? normalized.map((item) => (item.id === editingId ? listing : item))
      : [...normalized, listing];

    if (listing.isPrimary) {
      next = next.map((item) => ({ ...item, isPrimary: item.id === listing.id }));
    }

    onChange(normalizeManualSuppliers(next));
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_SUPPLIER_FORM);
  }

  function removeSupplier(id: string) {
    onChange(normalizeManualSuppliers(normalized.filter((item) => item.id !== id)));
    if (editingId === id) {
      setShowForm(false);
      setEditingId(null);
    }
  }

  const hasAutoIntel = Boolean(supplierIntel?.primary);
  const alternates = supplierIntel?.alternates ?? [];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-950">Supplier & procurement</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Add wholesale sources, listing links, contacts, and procurement notes for this product.
          </p>
        </div>
        {(updatedAt || supplierIntel?.searchedAt) && (
          <p className="text-[11px] text-neutral-400">
            {updatedAt
              ? `Updated ${new Date(updatedAt).toLocaleString("en-ZA")}`
              : `Researched ${new Date(supplierIntel!.searchedAt).toLocaleString("en-ZA")}`}
          </p>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {normalized.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/80 p-4 text-sm text-neutral-500">
            No suppliers added yet. Add suppliers manually with listing links, contacts, and procurement notes.
            {basePrice != null && basePrice > 0 && (
              <p className="mt-2 text-xs">Catalog cost price: {formatCurrency(basePrice, "ZAR")}</p>
            )}
          </div>
        ) : (
          normalized.map((listing) => (
            <div key={listing.id} className="relative">
              <ProductSupplierCard listing={listing} isPrimary={listing.isPrimary} />
              <div className="absolute right-3 top-3 flex gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(listing)}
                  className="rounded-lg border border-neutral-200 bg-white p-1.5 text-neutral-600 hover:bg-neutral-50"
                  aria-label="Edit supplier"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeSupplier(listing.id)}
                  className="rounded-lg border border-neutral-200 bg-white p-1.5 text-red-500 hover:bg-red-50"
                  aria-label="Remove supplier"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!showForm ? (
        <button
          type="button"
          onClick={openCreate}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          <Plus className="h-4 w-4" /> Add supplier
        </button>
      ) : (
        <form onSubmit={saveSupplier} className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4">
          <p className="mb-3 text-sm font-semibold text-neutral-900">
            {editingListing ? "Edit supplier" : "New supplier"}
          </p>
          <ProductSupplierEntryForm form={form} onChange={setForm} />
          <div className="mt-4 flex gap-2">
            <BtnPrimary type="submit">{editingListing ? "Save supplier" : "Add supplier"}</BtnPrimary>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="text-sm text-neutral-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {hasAutoIntel && supplierIntel && (
        <div className="mt-6 border-t border-neutral-100 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Auto-researched suppliers
          </p>
          {supplierIntel.cheapestWholesaleZar != null && (
            <p className="mt-2 text-xs text-neutral-600">
              Cheapest wholesale found:{" "}
              <span className="font-semibold text-emerald-700">
                {formatCurrency(supplierIntel.cheapestWholesaleZar, "ZAR")}
              </span>
            </p>
          )}
          <div className="mt-3 space-y-2">
            <ProductSupplierCard listing={supplierIntel.primary} isPrimary />
            {alternates.map((listing) => (
              <ProductSupplierCard key={listing.id} listing={listing} />
            ))}
          </div>
          {supplierIntel.researchNotes && (
            <div className="mt-3">
              <ProductSupplierResearchNotes notes={supplierIntel.researchNotes} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
