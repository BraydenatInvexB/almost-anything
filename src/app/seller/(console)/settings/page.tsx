import { getCurrentSeller, listSellerDocuments } from "@/services/seller-service";
import { getSellerPlatformContext } from "@/services/seller/platform-context";
import { SellerDocumentsPanel } from "@/components/seller/SellerDocumentsPanel";
import { SellerDeliveryPartnersPanel } from "@/components/seller/SellerDeliveryPartnersPanel";
import { SellerStockDefaultsPanel } from "@/components/seller/SellerStockDefaultsPanel";
import { PaymentGatewayFeesNotice } from "@/components/seller/PaymentGatewayFeesNotice";
import { Card } from "@/components/ui/Card";
import { getSellerEntityLabel } from "@/config/seller-entity-types";

export default async function SellerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const seller = await getCurrentSeller();
  if (!seller) return null;
  const [documents, platform, params] = await Promise.all([
    listSellerDocuments(seller.id),
    getSellerPlatformContext(),
    searchParams,
  ]);

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold">Business profile</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-neutral-500">Shop</dt><dd className="font-medium">{seller.shopName}</dd></div>
          <div><dt className="text-neutral-500">Company</dt><dd className="font-medium">{seller.companyName}</dd></div>
          <div><dt className="text-neutral-500">Entity type</dt><dd>{getSellerEntityLabel(seller.entityType)}</dd></div>
          <div><dt className="text-neutral-500">Email</dt><dd>{seller.contactEmail}</dd></div>
          <div><dt className="text-neutral-500">Phone</dt><dd>{seller.contactPhone}</dd></div>
          <div><dt className="text-neutral-500">Categories</dt><dd>{seller.sellsAllCategories ? "All categories" : seller.categorySlugs.join(", ") || "—"}</dd></div>
          <div><dt className="text-neutral-500">Status</dt><dd className="capitalize">{seller.status.replace("_", " ")}</dd></div>
        </dl>
      </Card>

      <SellerDocumentsPanel
        sellerId={seller.id}
        entityType={seller.entityType}
        documents={documents}
        onboarding={Boolean(params.onboarding)}
      />

      <SellerStockDefaultsPanel defaultStockOrigin={seller.defaultStockOrigin} />

      <SellerDeliveryPartnersPanel
        couriers={platform.couriers}
        shipping={platform.shipping}
        preferredCourierIds={seller.preferredCouriers}
      />

      <PaymentGatewayFeesNotice showLegal />
    </div>
  );
}
