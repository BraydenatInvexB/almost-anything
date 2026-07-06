import { Suspense } from "react";
import { SellerCatalogDesk } from "@/components/seller/SellerCatalogDesk";
import { listSellerProducts } from "@/services/seller/products";
import { getCurrentSeller } from "@/services/seller-service";
import { getPublicStorefrontSettings } from "@/services/storefront-settings-service";
import { sellerCan } from "@/config/seller-rbac";

export default async function SellerInventoryPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;
  const [products, settings] = await Promise.all([listSellerProducts(seller.id), getPublicStorefrontSettings()]);

  return (
    <Suspense fallback={<div className="text-sm text-neutral-500">Loading inventory…</div>}>
      <SellerCatalogDesk
        products={products}
        shipping={{
          flatShippingFee: Number(settings.flat_shipping_fee),
          freeShippingThreshold: Number(settings.free_shipping_threshold),
          defaultMarkupPercent: Number(settings.default_markup_percent),
        }}
        sellerApproved={seller.status === "approved"}
        defaultTab="stock"
        canEdit={sellerCan(seller, "products.edit")}
        canManageStock={sellerCan(seller, "inventory.manage")}
      />
    </Suspense>
  );
}
