"use client";

import { SellerProductEditor } from "@/components/seller/SellerProductEditor";
import type { StockOrigin } from "@/lib/admin/operations-inventory-types";
import type { SellerCatalogProduct, SellerCatalogShipping } from "@/types/seller-catalog";

export function SellerCatalogAddTab({
  shipping,
  sellerApproved,
  defaultStockOrigin,
  onAdded,
}: {
  shipping: SellerCatalogShipping;
  sellerApproved: boolean;
  defaultStockOrigin: StockOrigin;
  onAdded: (product: SellerCatalogProduct) => void;
}) {
  return (
    <SellerProductEditor
      mode="create"
      shipping={shipping}
      sellerApproved={sellerApproved}
      defaultStockOrigin={defaultStockOrigin}
      onSaved={onAdded}
    />
  );
}
