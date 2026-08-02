"use client";

import { X } from "lucide-react";
import { SellerProductEditor } from "@/components/seller/SellerProductEditor";
import type { StockOrigin } from "@/lib/admin/operations-inventory-types";
import type { SellerCatalogProduct, SellerCatalogShipping } from "@/types/seller-catalog";

export function SellerProductEditDrawer({
  product,
  shipping,
  sellerApproved,
  defaultStockOrigin,
  onClose,
  onSaved,
}: {
  product: SellerCatalogProduct;
  shipping: SellerCatalogShipping;
  sellerApproved: boolean;
  defaultStockOrigin: StockOrigin;
  onClose: () => void;
  onSaved: (product: SellerCatalogProduct) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close editor"
        className="absolute inset-0 bg-neutral-900/25 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-neutral-200 bg-neutral-50 shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-neutral-200 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Edit listing
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-neutral-950">{product.name}</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Photos, pricing, variants, features, specials, and supplier notes — same tools as admin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          <SellerProductEditor
            key={product.id}
            mode="edit"
            product={product}
            shipping={shipping}
            sellerApproved={sellerApproved}
            defaultStockOrigin={defaultStockOrigin}
            onCancel={onClose}
            onSaved={(saved) => {
              onSaved(saved);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
