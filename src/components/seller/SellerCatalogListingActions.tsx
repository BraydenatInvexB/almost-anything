"use client";

import { useState } from "react";
import { BtnSecondary } from "@/components/admin/ui";
import { canSellerChangeListing } from "@/lib/seller/listing-status";
import { normalizeListingStatus } from "@/config/seller-listing-status";
import type { SellerCatalogProduct } from "@/types/seller-catalog";

export function SellerCatalogListingActions({
  product,
  sellerApproved,
  canEdit,
  onUpdated,
}: {
  product: SellerCatalogProduct;
  sellerApproved: boolean;
  canEdit: boolean;
  onUpdated: (productId: string, listingStatus: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const status = normalizeListingStatus(product.listing_status);
  const locked = !canSellerChangeListing(status);

  if (!canEdit) return null;

  async function patchListingAction(listingAction: "draft" | "list") {
    setLoading(true);
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
      setLoading(false);
    }
  }

  if (locked) {
    return <span className="text-xs text-neutral-400">Contact support</span>;
  }

  if (status === "draft") {
    return (
      <BtnSecondary disabled={loading} onClick={() => void patchListingAction("list")}>
        {sellerApproved ? "List" : "Submit"}
      </BtnSecondary>
    );
  }

  return (
    <BtnSecondary disabled={loading} onClick={() => void patchListingAction("draft")}>
      Unlist
    </BtnSecondary>
  );
}
