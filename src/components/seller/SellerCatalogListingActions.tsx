"use client";

import { useState } from "react";
import { ImagePlus, Pencil, Trash2 } from "lucide-react";
import { BtnSecondary } from "@/components/admin/ui";
import { canSellerChangeListing } from "@/lib/seller/listing-status";
import { normalizeListingStatus } from "@/config/seller-listing-status";
import { cn } from "@/lib/utils/cn";
import type { SellerCatalogProduct } from "@/types/seller-catalog";

export function SellerCatalogListingActions({
  product,
  sellerApproved,
  canEdit,
  onEdit,
  onUpdated,
  onArchived,
}: {
  product: SellerCatalogProduct;
  sellerApproved: boolean;
  canEdit: boolean;
  onEdit: (product: SellerCatalogProduct) => void;
  onUpdated: (productId: string, listingStatus: string) => void;
  onArchived: (productId: string) => void;
}) {
  const [loading, setLoading] = useState<"list" | "archive" | null>(null);
  const status = normalizeListingStatus(product.listing_status);
  const locked = !canSellerChangeListing(status);
  const missingPhoto = !product.image_url;

  if (!canEdit) return null;

  async function patchListingAction(listingAction: "draft" | "list") {
    setLoading("list");
    try {
      const res = await fetch("/api/seller/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, listingAction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update listing");
      onUpdated(product.id, data.product.listing_status);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not update listing");
    } finally {
      setLoading(null);
    }
  }

  async function archiveProduct() {
    const confirmed = window.confirm(
      `Remove “${product.name}” from your catalog? You can contact support if you need it restored.`,
    );
    if (!confirmed) return;

    setLoading("archive");
    try {
      const res = await fetch(`/api/seller/products?id=${encodeURIComponent(product.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not remove product");
      onArchived(product.id);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not remove product");
    } finally {
      setLoading(null);
    }
  }

  if (locked) {
    return <span className="text-xs text-neutral-400">Contact support</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onEdit(product)}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
          missingPhoto
            ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
            : "bg-neutral-900 text-white hover:bg-neutral-800",
        )}
      >
        {missingPhoto ? <ImagePlus className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
        {missingPhoto ? "Add photos" : "Edit"}
      </button>

      {status === "draft" ? (
        <BtnSecondary disabled={loading !== null} onClick={() => void patchListingAction("list")}>
          {loading === "list" ? "…" : sellerApproved ? "List" : "Submit"}
        </BtnSecondary>
      ) : (
        <BtnSecondary disabled={loading !== null} onClick={() => void patchListingAction("draft")}>
          {loading === "list" ? "…" : "Unlist"}
        </BtnSecondary>
      )}

      <button
        type="button"
        disabled={loading !== null}
        onClick={() => void archiveProduct()}
        className="inline-flex items-center justify-center rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
        aria-label={`Remove ${product.name}`}
        title="Remove from catalog"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
