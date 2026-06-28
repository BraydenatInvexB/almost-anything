import Link from "next/link";
import { Plus } from "lucide-react";
import {
  getCurrentStaff,
  listAdminProducts,
  getSettings,
} from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { formatCurrency } from "@/lib/utils/cn";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "products.view")) return <AccessDenied feature="products" />;

  const { q = "" } = await searchParams;
  const [products, settings] = await Promise.all([listAdminProducts(), getSettings()]);
  const canEditMarkup = staffCan(staff, "products.markup");
  const canEdit = staffCan(staff, "products.edit");

  const totalRetail = products.reduce(
    (s, p) => s + p.base_price * (1 + Number(p.markup_percent) / 100),
    0,
  );
  const totalCost = products.reduce((s, p) => s + p.base_price, 0);
  const avgMarkup =
    products.reduce((s, p) => s + Number(p.markup_percent), 0) / (products.length || 1);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={
          q
            ? `Showing results for "${q}"`
            : "Manage your catalog, pricing, and the markup applied to every item."
        }
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Products" },
        ]}
        action={
          staffCan(staff, "products.edit") ? (
            <Link href="/admin/products/new" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand/90">
              <Plus className="h-4 w-4" />
              Add product
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Live products" value={String(products.length)} />
        <StatCard label="Avg. markup" value={`${avgMarkup.toFixed(1)}%`} />
        <StatCard label="Catalog cost" value={formatCurrency(totalCost, "ZAR")} />
        <StatCard
          label="Projected margin"
          value={formatCurrency(totalRetail - totalCost, "ZAR")}
        />
      </div>

      <ProductsManager
        products={products}
        canEditMarkup={canEditMarkup}
        canEdit={canEdit}
        minMarkup={Number(settings.min_markup_percent)}
        maxMarkup={Number(settings.max_markup_percent)}
        initialQuery={q}
      />
    </>
  );
}
