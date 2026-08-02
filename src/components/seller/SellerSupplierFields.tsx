"use client";

import { ChevronDown } from "lucide-react";
import { ProductFormField } from "@/components/admin/ProductFormField";
import { cn } from "@/lib/utils/cn";
import type { SellerSupplierInfo } from "@/lib/seller/product-supplier";

export function SellerSupplierFields({
  value,
  onChange,
}: {
  value: SellerSupplierInfo;
  onChange: (value: SellerSupplierInfo) => void;
}) {
  const open = value.tracked;

  function setTracked(tracked: boolean) {
    onChange(tracked ? { ...value, tracked: true } : { tracked: false });
  }

  function patch(partial: Partial<SellerSupplierInfo>) {
    onChange({ ...value, tracked: true, ...partial });
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setTracked(!open)}
        className="flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div>
          <h2 className="text-sm font-semibold text-neutral-950">Supplier info</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Optional — keep private notes on who you source this product from. Not shown to customers.
          </p>
        </div>
        <span
          className={cn(
            "mt-0.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            open ? "bg-emerald-50 text-emerald-800" : "bg-neutral-100 text-neutral-600",
          )}
        >
          {open ? "Tracking on" : "Not tracking"}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {open ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ProductFormField label="Supplier name">
            <input
              className="input"
              placeholder="e.g. Cape Trade Supplies"
              value={value.name ?? ""}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </ProductFormField>
          <ProductFormField label="Contact" hint="Email or phone">
            <input
              className="input"
              placeholder="orders@supplier.co.za"
              value={value.contact ?? ""}
              onChange={(e) => patch({ contact: e.target.value })}
            />
          </ProductFormField>
          <ProductFormField label="Supplier SKU / order code">
            <input
              className="input"
              placeholder="Their product code"
              value={value.sku ?? ""}
              onChange={(e) => patch({ sku: e.target.value })}
            />
          </ProductFormField>
          <ProductFormField label="Supplier URL">
            <input
              className="input"
              type="url"
              placeholder="https://"
              value={value.url ?? ""}
              onChange={(e) => patch({ url: e.target.value })}
            />
          </ProductFormField>
          <ProductFormField label="Private notes" className="sm:col-span-2">
            <textarea
              className="input min-h-22 resize-y"
              placeholder="MOQ, lead time, account number, etc."
              value={value.notes ?? ""}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </ProductFormField>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => setTracked(false)}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 hover:underline"
            >
              Stop tracking supplier for this product
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setTracked(true)}
          className="mt-4 text-sm font-semibold text-brand hover:underline"
        >
          Add supplier details
        </button>
      )}
    </section>
  );
}
