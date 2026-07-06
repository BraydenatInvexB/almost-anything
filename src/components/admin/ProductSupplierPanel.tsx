"use client";

import type { ProductSupplierIntel } from "@/types/supplier-sourcing";
import { ProductSupplierCard, ProductSupplierResearchNotes } from "@/components/admin/ProductSupplierCard";
import { formatCurrency } from "@/lib/utils/cn";

type Props = {
  sourceName?: string;
  sourceUrl?: string;
  basePrice?: number;
  supplierIntel?: ProductSupplierIntel;
};

export function ProductSupplierPanel({ sourceName, sourceUrl, basePrice, supplierIntel }: Props) {
  const hasIntel = Boolean(supplierIntel?.primary);
  const alternates = supplierIntel?.alternates ?? [];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-950">Supplier & procurement</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Wholesale sources used to price this product. Use these links to place purchase orders.
          </p>
        </div>
        {supplierIntel?.searchedAt && (
          <p className="text-[11px] text-neutral-400">
            Researched {new Date(supplierIntel.searchedAt).toLocaleString("en-ZA")}
          </p>
        )}
      </div>

      {!hasIntel && (
        <div className="mt-4 rounded-lg border border-dashed border-neutral-200 bg-neutral-50/80 p-4">
          <p className="text-sm font-medium text-neutral-700">{sourceName || "No supplier linked"}</p>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
            >
              {sourceUrl}
            </a>
          ) : (
            <p className="mt-1 text-xs text-neutral-400">
              Add suppliers on the product edit form with listing URLs and procurement details.
            </p>
          )}
          {basePrice != null && basePrice > 0 && (
            <p className="mt-2 text-xs text-neutral-500">
              Catalog cost price: {formatCurrency(basePrice, "ZAR")}
            </p>
          )}
        </div>
      )}

      {hasIntel && supplierIntel && (
        <div className="mt-4 space-y-4">
          {supplierIntel.cheapestWholesaleZar != null && (
            <p className="text-xs text-neutral-600">
              Cheapest wholesale found:{" "}
              <span className="font-semibold text-emerald-700">
                {formatCurrency(supplierIntel.cheapestWholesaleZar, "ZAR")}
              </span>
            </p>
          )}
          <ProductSupplierCard listing={supplierIntel.primary} isPrimary />
          {alternates.length > 0 && (
            <div className="space-y-2">
              {alternates.map((listing) => (
                <ProductSupplierCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
          {supplierIntel.researchNotes && (
            <ProductSupplierResearchNotes notes={supplierIntel.researchNotes} />
          )}
        </div>
      )}
    </div>
  );
}
