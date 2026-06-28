import Link from "next/link";
import { Truck, PackageCheck, Clock } from "lucide-react";
import { getCurrentStaff, getFulfillmentQueue, listAdminOrders } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { PageHeader, StatCard, Panel, WorkflowCard } from "@/components/admin/ui";

export default async function AdminFulfillmentPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "orders.view")) {
    return <AccessDenied feature="fulfillment" />;
  }

  const canManage = staffCan(staff, "orders.manage");
  const queue = await getFulfillmentQueue();
  const allOrders = await listAdminOrders();
  const paid = allOrders.filter((o) => o.status === "paid").length;
  const purchased = allOrders.filter((o) => o.status === "purchased").length;
  const shippedToday = allOrders.filter((o) => {
    if (o.status !== "shipped") return false;
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  return (
    <>
      <PageHeader
        title="Fulfillment"
        subtitle="Pick, pack, and ship orders. This is your daily operations queue for warehouse and logistics teams."
        action={
          <Link
            href="/admin/orders?status=paid"
            className="inline-flex h-9 items-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            All orders
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Awaiting sourcing"
          value={String(paid)}
          icon={<Clock className="h-4 w-4" />}
          accent="bg-amber-500"
          hint="Paid, not yet purchased from supplier"
        />
        <StatCard
          label="Ready to ship"
          value={String(purchased)}
          icon={<PackageCheck className="h-4 w-4" />}
          accent="bg-brand"
          hint="Purchased and ready for dispatch"
        />
        <StatCard
          label="Shipped today"
          value={String(shippedToday)}
          icon={<Truck className="h-4 w-4" />}
          accent="bg-neutral-950"
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <WorkflowCard
          title="Paid orders"
          count={paid}
          description="Confirm supplier purchase and move to purchased when stock is secured."
          href="/admin/orders?status=paid"
          urgent={paid > 5}
        />
        <WorkflowCard
          title="Ready to ship"
          count={purchased}
          description="Generate labels, add tracking, and mark orders as shipped."
          href="/admin/orders?status=purchased"
          urgent={purchased > 3}
        />
        <WorkflowCard
          title="In transit"
          count={allOrders.filter((o) => o.status === "shipped").length}
          description="Monitor deliveries and resolve exceptions with support."
          href="/admin/orders?status=shipped"
        />
      </div>

      <Panel
        title="Active fulfillment queue"
        description={`${queue.length} orders need action now`}
      >
        <OrdersTable orders={queue} canManage={canManage} />
      </Panel>
    </>
  );
}
