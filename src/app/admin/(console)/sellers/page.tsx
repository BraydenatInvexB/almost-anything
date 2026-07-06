import { Suspense } from "react";
import { getCurrentStaff, listAllSellers, countSellerProducts } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { SellersDesk } from "@/components/admin/SellersDesk";
import { SellersDeskFilters } from "@/components/admin/SellersDeskFilters";
import type { SellerDeskFilter } from "@/types/seller-admin";

async function getFilterCounts() {
  const all = await listAllSellers("all");
  return {
    all: all.length,
    pending_review: all.filter((s) => s.status === "pending_review").length,
    approved: all.filter((s) => s.status === "approved").length,
    suspended: all.filter((s) => s.status === "suspended").length,
    rejected: all.filter((s) => s.status === "rejected").length,
  } satisfies Record<SellerDeskFilter, number>;
}

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "sellers.view")) {
    return <AccessDenied feature="seller management" />;
  }

  const params = await searchParams;
  const filter = (params.status as SellerDeskFilter | undefined) ?? "all";
  const validFilter: SellerDeskFilter =
    filter === "pending_review" || filter === "approved" || filter === "suspended" || filter === "rejected"
      ? filter
      : "all";

  const [sellers, counts] = await Promise.all([
    listAllSellers(validFilter),
    getFilterCounts(),
  ]);

  const productCounts: Record<string, number> = {};
  await Promise.all(
    sellers.map(async (seller) => {
      productCounts[seller.id] = await countSellerProducts(seller.id);
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Marketplace sellers</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Review applications, moderate listings, communicate with sellers, and keep marketplace standards high.
        </p>
      </div>

      <Suspense fallback={null}>
        <SellersDeskFilters counts={counts} />
      </Suspense>

      <SellersDesk sellers={sellers} productCounts={productCounts} />
    </div>
  );
}
