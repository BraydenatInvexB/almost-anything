import Link from "next/link";
import { getCurrentStaff, getSettings } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader, BtnSecondary } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function AdminNewProductPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "products.edit")) return <AccessDenied feature="product creation" />;

  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title="Add product"
        subtitle="Create a new catalog item with full description, pricing, stock origin, and delivery estimates."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: "Add product" },
        ]}
        action={<BtnSecondary href="/admin/products">Back to catalog</BtnSecondary>}
      />
      <ProductForm defaultMarkup={settings.default_markup_percent} />
    </>
  );
}
