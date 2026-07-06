"use client";

import Link from "next/link";
import { Check, ExternalLink, Loader2, Pencil, Star, Trash2 } from "lucide-react";
import {
  StorefrontSectionToggles,
} from "@/components/admin/StorefrontSectionToggles";
import type { StorefrontSectionFlags } from "@/config/storefront-sections";
import { formatCurrency } from "@/lib/utils/cn";
import type { Product } from "@/types/database";
import { parseProductEnrichment } from "@/types/product-enrichment";
import { primaryManualSupplier } from "@/lib/product/product-manual-suppliers";
import { compactStockLabel, type ProductsManagerDeleteState, type ProductsManagerSaveState } from "@/components/admin/products-manager-utils";

export function ProductsManagerRow({
  product,
  markup,
  retail,
  saveState,
  deleteState,
  sections,
  sectionSaving,
  canEditMarkup,
  canEdit,
  onSetMarkup,
  onSave,
  onRemove,
  onUpdateSections,
}: {
  product: Product;
  markup: number;
  retail: number;
  saveState: ProductsManagerSaveState;
  deleteState: ProductsManagerDeleteState;
  sections: StorefrontSectionFlags;
  sectionSaving: boolean;
  canEditMarkup: boolean;
  canEdit?: boolean;
  onSetMarkup: (id: string, value: number, basePrice: number) => void;
  onSave: (product: Product) => void;
  onRemove: (product: Product) => void;
  onUpdateSections: (product: Product, next: StorefrontSectionFlags) => void;
}) {
  const dirty = Math.abs(markup - Number(product.markup_percent)) > 0.001;
  const removing = deleteState === "deleting";
  const enrichment = parseProductEnrichment(product.metadata);
  const manualPrimary = primaryManualSupplier(enrichment.manualSuppliers ?? []);
  const supplierName =
    manualPrimary?.supplierName ??
    enrichment.supplierIntel?.primary.supplierName ??
    product.source_name ??
    null;
  const supplierUrl =
    manualPrimary?.supplierUrl ??
    enrichment.supplierIntel?.primary.supplierUrl ??
    product.source_url ??
    null;

  return (
    <tr className="hover:bg-neutral-50/80">
      <td className="px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="h-9 w-9 shrink-0 rounded-md bg-neutral-100" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-900">{product.name}</p>
            <p className="flex items-center gap-1 truncate text-[11px] text-neutral-400">
              <Star className="h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400" />
              {product.rating} · <span className="capitalize">{product.category}</span>
            </p>
            {supplierName && (
              <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-neutral-500">
                <span className="truncate">{supplierName}</span>
                {supplierUrl && (
                  <a
                    href={supplierUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center text-brand hover:underline"
                    title="Open supplier listing"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="hidden px-2 py-2.5 text-xs text-neutral-600 sm:table-cell">
        {formatCurrency(product.base_price, product.currency)}
      </td>
      <td className="px-2 py-2.5">
        {canEditMarkup ? (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onSetMarkup(product.id, Math.round((markup - 1) * 10) / 10, product.base_price)}
              className="flex h-6 w-6 items-center justify-center rounded border border-neutral-200 text-xs text-neutral-500 hover:bg-neutral-100"
            >
              −
            </button>
            <input
              type="number"
              value={markup}
              onChange={(e) => onSetMarkup(product.id, Number(e.target.value), product.base_price)}
              className="h-6 w-12 rounded border border-neutral-200 px-1 text-center text-xs focus:border-neutral-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onSetMarkup(product.id, Math.round((markup + 1) * 10) / 10, product.base_price)}
              className="flex h-6 w-6 items-center justify-center rounded border border-neutral-200 text-xs text-neutral-500 hover:bg-neutral-100"
            >
              +
            </button>
          </div>
        ) : (
          <span className="text-xs">{markup.toFixed(1)}%</span>
        )}
      </td>
      <td className="hidden px-2 py-2.5 text-xs font-semibold md:table-cell">
        {formatCurrency(retail, product.currency)}
      </td>
      <td className="hidden px-2 py-2.5 lg:table-cell">
        <span
          className="inline-flex rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600"
          title={compactStockLabel(product.stock_status)}
        >
          {compactStockLabel(product.stock_status)}
        </span>
      </td>
      <td className="hidden px-2 py-2.5 lg:table-cell">
        <StorefrontSectionToggles
          compact
          disabled={!canEdit || sectionSaving}
          value={sections}
          onChange={(next) => onUpdateSections(product, next)}
        />
      </td>
      {(canEditMarkup || canEdit) && (
        <td className="px-2 py-2.5">
          <div className="flex items-center justify-end gap-1">
            {canEdit && (
              <>
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  title="Edit product"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  disabled={removing}
                  onClick={() => onRemove(product)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  title={`Remove ${product.name}`}
                >
                  {removing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </>
            )}
            {canEditMarkup && (
              <button
                type="button"
                disabled={!dirty || saveState === "saving"}
                onClick={() => onSave(product)}
                title={saveState === "saved" ? "Saved" : "Save markup"}
                className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full bg-neutral-900 px-2 text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                {saveState === "saving" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saveState === "saved" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  "Save"
                )}
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
