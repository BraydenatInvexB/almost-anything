import Link from "next/link";
import { getCurrentStaff, listAdminOrders, listAdminCouriers } from "@/services/admin-service";
import { listProcurement } from "@/lib/admin/operations-persistence";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { OperationsDesk } from "@/components/admin/OperationsDesk";
import { OperationsFlowBar } from "@/components/admin/OperationsFlowBar";
import { countOrdersByStatus, type OperationsTabId } from "@/lib/orders/order-workflow";
import { PageHeader, StatCard, WorkflowCard } from "@/components/admin/ui";
import { PackageCheck, Truck, Warehouse } from "lucide-react";

const VALID_TABS = new Set<OperationsTabId>(["action", "shipping", "all"]);

export default async function AdminFulfillmentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "orders.view")) {
    return <AccessDenied feature="fulfillment" />;
  }

  const params = await searchParams;
  const initialTab: OperationsTabId = VALID_TABS.has(params.tab as OperationsTabId)
    ? (params.tab as OperationsTabId)
    : "action";

  const canManage = staffCan(staff, "orders.manage");
  const [orders, couriers, procurement] = await Promise.all([
    listAdminOrders(),
    listAdminCouriers(),
    listProcurement(),
  ]);

  const awaitingInbound = countOrdersByStatus(orders, ["paid", "sourcing"]);
  const readyToShip = countOrdersByStatus(orders, ["purchased"]);
  const inTransitInbound = procurement.filter((p) => p.status === "in_transit").length;
  const outForDelivery = countOrdersByStatus(orders, ["shipped"]);

  return (
    <>
      <PageHeader
        title="Operations center"
        subtitle="One queue, one status per order — work through payment → inbound → ship → deliver."
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
          hint="Paid or sourcing — stock moving to your hub"
        />
        <StatCard
          label="Inbound in transit"
          value={String(inTransitInbound)}
          icon={<Truck className="h-4 w-4" />}
          accent="bg-violet-600"
          hint="Supplier shipments en route to warehouse"
        />
        <StatCard
          label="Ready to ship"
          value={String(readyToShip)}
          icon={<PackageCheck className="h-4 w-4" />}
          accent="bg-brand"
          hint="Received at hub — pack and dispatch"
        />
        <StatCard
          label="Out for delivery"
          value={String(outForDelivery)}
          icon={<Truck className="h-4 w-4" />}
          accent="bg-neutral-950"
          hint="With courier — confirm delivery when done"
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <WorkflowCard
          title="Needs action"
          count={countOrdersByStatus(orders, ["paid", "sourcing", "purchased"])}
          description="Confirm suppliers, receive inbound stock, and dispatch to customers."
          href="/admin/fulfillment?tab=action"
          urgent={awaitingInbound + readyToShip > 0}
        />
        <WorkflowCard
          title="Out for delivery"
          count={outForDelivery}
          description="Track parcels and mark orders delivered when they arrive."
          href="/admin/fulfillment?tab=shipping"
          urgent={outForDelivery > 0}
        />
        <WorkflowCard
          title="Completed orders"
          count={countOrdersByStatus(orders, ["delivered"])}
          description="Review delivered and archived orders in the full order list."
          href="/admin/orders?status=delivered"
        />
      </div>

      <OperationsFlowBar orders={orders} activeTab={initialTab} />
      <OperationsDesk
        orders={orders}
        couriers={couriers}
        canManage={canManage}
        initialTab={initialTab}
      />
    </>
  );
}
