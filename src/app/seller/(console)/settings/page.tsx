import { getCurrentSeller, listSellerDocuments } from "@/services/seller-service";
import { SellerDocumentsPanel } from "@/components/seller/SellerDocumentsPanel";
import { Card } from "@/components/ui/Card";
import { COURIERS } from "@/config/couriers";
import { getSellerEntityLabel } from "@/config/seller-entity-types";

export default async function SellerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const seller = await getCurrentSeller();
  if (!seller) return null;
  const documents = await listSellerDocuments(seller.id);
  const params = await searchParams;

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

      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold">Preferred couriers</h2>
        <p className="mt-1 text-sm text-neutral-600">Couriers you use to ship orders to customers.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {COURIERS.map((courier) => (
            <span
              key={courier.id}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                seller.preferredCouriers.includes(courier.id)
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-neutral-200 text-neutral-600"
              }`}
            >
              {courier.name}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
