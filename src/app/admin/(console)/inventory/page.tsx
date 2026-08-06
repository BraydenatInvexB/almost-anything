import { getCurrentStaff, listAdminProducts, listInventory } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { InventoryDesk } from "@/components/admin/InventoryDesk";

export default async function AdminInventoryPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "inventory.view")) return <AccessDenied feature="inventory" />;

  const inventory = await listInventory();
  const products = await listAdminProducts();
  const low = inventory.filter((i) => i.quantity <= i.reorderPoint).length;
  const sa = inventory.filter((i) => i.origin === "sa_warehouse").length;
  const overseas = inventory.filter((i) => i.origin === "overseas").length;

  return (
    <>
      <PageHeader title="Inventory" subtitle="See JHB, DBN, and CPT stock at a glance, then open a product to update its hub quantities." />
      <div className="mb-4 grid grid-cols-3 gap-4">
        <StatCard label="SKUs tracked" value={String(inventory.length)} accent="bg-neutral-950" />
        <StatCard label="Local hub products" value={String(sa)} accent="bg-brand" hint="JHB, DBN, or CPT" />
        <StatCard label="Overseas / low" value={`${overseas} / ${low}`} accent="bg-amber-500" hint="Pipeline or reorder needed" />
      </div>
      <InventoryDesk
        inventory={inventory}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          metadata: p.metadata,
          quantity: Number((p.metadata as { quantity?: unknown } | null)?.quantity ?? 0),
        }))}
        canManage={staffCan(staff, "inventory.manage")}
      />
    </>
  );
}
