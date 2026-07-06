import { Suspense } from "react";
import { SellerCatalogDesk } from "@/components/seller/SellerCatalogDesk";
import { listSellerProducts } from "@/services/seller/products";
import { getSellerPlatformContext } from "@/services/seller/platform-context";
import { getCurrentSeller } from "@/services/seller-service";
import { sellerCan } from "@/config/seller-rbac";

export default async function SellerProductsPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;
  const [products, platform] = await Promise.all([
    listSellerProducts(seller.id),
    getSellerPlatformContext(),
  ]);

  return (
    <Suspense fallback={<div className="text-sm text-neutral-500">Loading catalog…</div>}>
      <SellerCatalogDesk
        products={products}
        shipping={platform.shipping}
        sellerApproved={seller.status === "approved"}
        defaultStockOrigin={seller.defaultStockOrigin}
        defaultTab="products"
        canEdit={sellerCan(seller, "products.edit")}
        canManageStock={sellerCan(seller, "inventory.manage")}
      />
    </Suspense>
  );
}
