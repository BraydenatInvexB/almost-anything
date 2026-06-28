import { notFound } from "next/navigation";
import { getCurrentStaff, getSettings, getAdminProduct } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader, BtnSecondary } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "products.edit")) return <AccessDenied feature="product editing" />;

  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) notFound();

  const settings = await getSettings();
  const meta = (product.metadata ?? {}) as Record<string, unknown>;

  return (
    <>
      <PageHeader
        title={`Edit · ${product.name}`}
        subtitle="Update description, pricing, stock origin, and delivery estimates."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: product.name },
        ]}
        action={<BtnSecondary href="/admin/products">Back to catalog</BtnSecondary>}
      />
      <ProductForm
        defaultMarkup={settings.default_markup_percent}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          category: product.category,
          base_price: product.base_price,
          markup_percent: Number(product.markup_percent),
          stock_status: product.stock_status,
          stock_origin: (meta.stock_origin as string) ?? "sa_warehouse",
          quantity: Number(meta.quantity ?? 10),
          image_url: product.image_url ?? "",
          source_name: product.source_name ?? "",
          delivery_days_min: product.delivery_days_min,
          delivery_days_max: product.delivery_days_max,
          is_featured: product.is_featured,
          is_deal: product.is_deal,
        }}
      />
    </>
  );
}
