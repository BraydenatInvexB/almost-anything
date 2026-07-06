import { Suspense } from "react";
import {
  countPendingSellerDocuments,
  countPendingSellerPayouts,
  countSellerProducts,
  getCurrentStaff,
  listAllSellerProductsForAdmin,
  listAllSellers,
  listSellerDocumentsQueue,
  listSellerPayoutsQueue,
} from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { SellersDesk } from "@/components/admin/SellersDesk";
import { SellersDeskFilters } from "@/components/admin/SellersDeskFilters";
import { SellersAdminNav } from "@/components/admin/SellersAdminNav";
import { SellerProductsManager } from "@/components/admin/SellerProductsManager";
import { SellersDocumentsQueue } from "@/components/admin/SellersDocumentsQueue";
import { SellersPayoutsQueue } from "@/components/admin/SellersPayoutsQueue";
import type { SellerDeskFilter, SellersAdminView } from "@/types/seller-admin";

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
  searchParams: Promise<{ status?: string; view?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "sellers.view")) {
    return <AccessDenied feature="seller management" />;
  }

  const params = await searchParams;
  const view = (params.view as SellersAdminView | undefined) ?? "sellers";
  const filter = (params.status as SellerDeskFilter | undefined) ?? "all";
  const validFilter: SellerDeskFilter =
    filter === "pending_review" || filter === "approved" || filter === "suspended" || filter === "rejected"
      ? filter
      : "all";

  const canManage = staffCan(staff, "sellers.manage");
  const canEditProducts = staffCan(staff, "products.edit");

  const [navCounts, sellers, counts, products, documents, payouts] = await Promise.all([
    Promise.all([
      listAllSellerProductsForAdmin().then((rows) => rows.length),
      countPendingSellerDocuments(),
      countPendingSellerPayouts(),
    ]).then(([products, documents, payouts]) => ({ products, documents, payouts })),
    view === "sellers" ? listAllSellers(validFilter) : Promise.resolve([]),
    view === "sellers" ? getFilterCounts() : Promise.resolve(null),
    view === "products" ? listAllSellerProductsForAdmin() : Promise.resolve([]),
    view === "documents" ? listSellerDocumentsQueue("all") : Promise.resolve([]),
    view === "payouts" ? listSellerPayoutsQueue("all") : Promise.resolve([]),
  ]);

  const productCounts: Record<string, number> = {};
  if (view === "sellers" && sellers.length) {
    await Promise.all(
      sellers.map(async (seller) => {
        productCounts[seller.id] = await countSellerProducts(seller.id);
      }),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Marketplace sellers</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Review applications, moderate listings, verify documents, process payouts, and message sellers from one hub.
        </p>
      </div>

      <Suspense fallback={null}>
        <SellersAdminNav counts={navCounts} />
      </Suspense>

      {view === "products" ? (
        <SellerProductsManager products={products} canEdit={canEditProducts} canManage={canManage} />
      ) : null}

      {view === "documents" ? (
        <SellersDocumentsQueue documents={documents} canManage={canManage} />
      ) : null}

      {view === "payouts" ? (
        <SellersPayoutsQueue payouts={payouts} canManage={canManage} />
      ) : null}

      {view === "sellers" ? (
        <>
          <Suspense fallback={null}>
            <SellersDeskFilters counts={counts ?? (await getFilterCounts())} />
          </Suspense>
          <SellersDesk sellers={sellers} productCounts={productCounts} canManage={canManage} />
        </>
      ) : null}
    </div>
  );
}
