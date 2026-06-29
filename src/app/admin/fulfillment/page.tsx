import Link from "next/link";
import { Truck, PackageCheck, Warehouse } from "lucide-react";
import { getCurrentStaff, getFulfillmentQueue, listAdminOrders } from "@/services/admin-service";
import { listProcurement } from "@/lib/admin/operations-persistence";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { OrdersKanban } from "@/components/admin/OrdersKanban";
import { filterKanbanOrders } from "@/lib/orders/kanban-filters";
import { PageHeader, StatCard, Panel, WorkflowCard } from "@/components/admin/ui";

export default async function AdminFulfillmentPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "orders.view")) {
    return <AccessDenied feature="fulfillment" />;
  }

  const canManage = staffCan(staff, "orders.manage");
  const queue = await getFulfillmentQueue();
  const allOrders = await listAdminOrders();
  const procurement = await listProcurement();
  const awaitingInbound = allOrders.filter((o) => o.status === "paid" || o.status === "sourcing").length;
  const readyToShip = allOrders.filter((o) => o.status === "purchased").length;
  const inTransitInbound = procurement.filter((p) => p.status === "in_transit").length;
  const shippedToday = allOrders.filter((o) => {
    if (o.status !== "shipped") return false;
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const kanbanOrders = filterKanbanOrders(allOrders);

  return (
    <>
      <PageHeader
        title="Operations center"
        subtitle="Manage the full pipeline: international warehouse → receive at hub → ship to customer."
        action={
          <Link
            href="/admin/procurement"
            className="inline-flex h-10 items-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
          >
            Inbound stock
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Awaiting inbound"
          value={String(awaitingInbound)}
          icon={<Warehouse className="h-4 w-4" />}
          accent="bg-amber-500"
          hint="Paid — stock moving from international warehouse"
        />
        <StatCard
          label="Inbound in transit"
          value={String(inTransitInbound)}
          icon={<Truck className="h-4 w-4" />}
          accent="bg-violet-600"
          hint="Shipments en route to your warehouse"
        />
        <StatCard
          label="Ready to ship"
          value={String(readyToShip)}
          icon={<PackageCheck className="h-4 w-4" />}
          accent="bg-brand"
          hint="Received at hub — pack and dispatch"
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
          title="International warehouse"
          count={awaitingInbound}
          description="Confirm supplier orders and track inbound delivery to your hub."
          href="/admin/orders?status=paid"
          urgent={awaitingInbound > 0}
        />
        <WorkflowCard
          title="Ready to ship"
          count={readyToShip}
          description="Add courier tracking and mark orders as shipped to customers."
          href="/admin/orders?status=purchased"
          urgent={readyToShip > 0}
        />
        <WorkflowCard
          title="Out for delivery"
          count={allOrders.filter((o) => o.status === "shipped").length}
          description="Monitor customer deliveries and resolve exceptions."
          href="/admin/orders?status=shipped"
        />
      </div>

      <Panel
        title="Drag & drop pipeline"
        description="Drag orders between columns to update status"
        className="mb-4"
      >
        <div className="p-4">
          <OrdersKanban orders={kanbanOrders} canManage={canManage} />
        </div>
      </Panel>

      <Panel
        title="Active operations queue"
        description={`${queue.length} orders need action now`}
        clip
      >
        <OrdersTable orders={queue} canManage={canManage} />
      </Panel>
    </>
  );
}
