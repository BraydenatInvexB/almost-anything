import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  getCurrentStaff,
  listAdminProducts,
  listAllSellerProductsForAdmin,
  getSettings,
} from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { SellerProductsManager } from "@/components/admin/SellerProductsManager";
import { AdminCatalogTabs } from "@/components/admin/AdminCatalogTabs";
import { formatCurrency } from "@/lib/utils/cn";
import type { AdminCatalogTab } from "@/types/seller-admin";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "products.view")) return <AccessDenied feature="products" />;

  const params = await searchParams;
  const tab: AdminCatalogTab = params.tab === "seller" ? "seller" : "platform";
  const q = params.q ?? "";

  const [products, sellerProducts, settings] = await Promise.all([
    listAdminProducts(),
    listAllSellerProductsForAdmin(),
    getSettings(),
  ]);

  const platformProducts = products.filter((p) => !p.seller_id);
  const canEditMarkup = staffCan(staff, "products.markup");
  const canEdit = staffCan(staff, "products.edit");
  const canManageSellers = staffCan(staff, "sellers.manage");
  const catalog = tab === "seller" ? sellerProducts : platformProducts;
  const totalRetail = catalog.reduce((s, p) => s + Number("retailPrice" in p ? p.retailPrice : p.retail_price), 0);
  const totalCost = catalog.reduce((s, p) => s + Number("basePrice" in p ? p.basePrice : p.base_price), 0);
  const avgMarkup =
    catalog.reduce((s, p) => s + Number("markupPercent" in p ? p.markupPercent : p.markup_percent), 0) /
    (catalog.length || 1);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={
          tab === "seller"
            ? "Every seller listing in one place — feature items on Hot, Deals, and Fresh."
            : q
              ? `Showing results for "${q}"`
              : "Manage your catalog, pricing, and the markup applied to every item."
        }
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Products" },
        ]}
        action={
          tab === "platform" && staffCan(staff, "products.edit") ? (
            <Link href="/admin/products/new" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand/90">
              <Plus className="h-4 w-4" />
              Add product
            </Link>
          ) : undefined
        }
      />

      <Suspense fallback={null}>
        <AdminCatalogTabs sellerCount={sellerProducts.length} />
      </Suspense>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={tab === "seller" ? "Seller listings" : "Live products"} value={String(catalog.length)} />
        <StatCard label="Avg. markup" value={`${avgMarkup.toFixed(1)}%`} />
        <StatCard label="Catalog cost" value={formatCurrency(totalCost, "ZAR")} />
        <StatCard label="Projected margin" value={formatCurrency(totalRetail - totalCost, "ZAR")} />
      </div>

      {tab === "seller" ? (
        <SellerProductsManager
          products={sellerProducts}
          canEdit={canEdit}
          canManage={canManageSellers}
        />
      ) : (
        <ProductsManager
          products={platformProducts}
          canEditMarkup={canEditMarkup}
          canEdit={canEdit}
          minMarkup={Number(settings.min_markup_percent)}
          maxMarkup={Number(settings.max_markup_percent)}
          initialQuery={q}
        />
      )}
    </>
  );
}
