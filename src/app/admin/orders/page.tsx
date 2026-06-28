import Link from "next/link";
import { getCurrentStaff, listAdminOrders } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader, StatCard, Panel } from "@/components/admin/ui";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { formatCurrency } from "@/lib/utils/cn";
import { cn } from "@/lib/utils/cn";

const FILTERS = ["all", "pending", "paid", "purchased", "shipped", "delivered", "cancelled"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "orders.view")) return <AccessDenied feature="orders" />;
  const canManage = staffCan(staff, "orders.manage");

  const { status = "all", q = "" } = await searchParams;
  let orders = await listAdminOrders();
  if (q.trim()) {
    const query = q.trim().toLowerCase();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query) ||
        o.customerEmail.toLowerCase().includes(query),
    );
  }
  const filtered = status === "all" ? orders : orders.filter((o) => o.status === status);

  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const toShip = orders.filter((o) => o.status === "paid" || o.status === "purchased").length;

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle={
          q
            ? `Showing results for "${q}"`
            : "Track, process, and fulfill every customer order in one place."
        }
        action={
          <Link
            href="/admin/fulfillment"
            className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand/90"
          >
            Fulfillment queue
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total orders" value={String(orders.length)} />
        <StatCard label="Revenue" value={formatCurrency(revenue, "ZAR")} />
        <StatCard label="Awaiting payment" value={String(pending)} />
        <StatCard label="Ready to ship" value={String(toShip)} />
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/orders" : `/admin/orders?status=${f}`}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors",
              status === f
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
            )}
          >
            {f}
          </Link>
        ))}
      </div>

      <Panel>
        <OrdersTable orders={filtered} canManage={canManage} />
      </Panel>
    </>
  );
}
