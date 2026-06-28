import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getCurrentStaff,
  getAdminOrder,
} from "@/services/admin-service";
import { listReturnsByOrder } from "@/lib/admin/operations-store";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { OrderDetailActions } from "@/components/admin/OrderDetailActions";
import {
  PageHeader,
  Panel,
  StatusBadge,
  Timeline,
  DetailGrid,
  DetailItem,
  BtnSecondary,
} from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import { resolveFulfillment } from "@/lib/orders/fulfillment";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "orders.view")) return <AccessDenied feature="orders" />;

  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const canManage = staffCan(staff, "orders.manage");
  const orderReturns = listReturnsByOrder(order.id).length
    ? listReturnsByOrder(order.id)
    : listReturnsByOrder(order.orderNumber);
  const fulfillment = resolveFulfillment({
    stockOrigin: order.stockOrigin,
    shippingCountry: order.shippingAddress.country,
  });

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        subtitle={`Placed ${new Date(order.createdAt).toLocaleString("en-ZA", { dateStyle: "full", timeStyle: "short" })}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Orders", href: "/admin/orders" },
          { label: order.orderNumber },
        ]}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            {order.customerId && (
              <BtnSecondary href={`/admin/customers/${order.customerId}`}>
                View customer
              </BtnSecondary>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Panel title="Line items">
            <ul className="divide-y divide-neutral-100">
              {order.lineItems.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-lg">📦</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-950">{item.name}</p>
                    <p className="text-xs text-neutral-500">Qty {item.quantity}</p>
                  </div>
                  <p className="font-semibold tabular-nums">
                    {formatCurrency(item.unitPrice * item.quantity, order.currency)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="border-t border-neutral-100 px-5 py-4 text-sm">
              <div className="flex justify-between py-1 text-neutral-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between py-1 text-neutral-600">
                <span>Shipping</span>
                <span>
                  {order.shippingCost === 0 ? (
                    <span className="font-medium text-emerald-600">Free</span>
                  ) : (
                    formatCurrency(order.shippingCost, order.currency)
                  )}
                </span>
              </div>
              {order.shippingInternalCost != null && order.shippingInternalCost > 0 && (
                <div className="flex justify-between py-1 text-xs text-neutral-400">
                  <span>Internal courier cost</span>
                  <span>{formatCurrency(order.shippingInternalCost, order.currency)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.total, order.currency)}</span>
              </div>
            </div>
          </Panel>

          <Panel title="Fulfillment & status" description="Update order status, carrier, and tracking.">
            <div className="p-5">
              <OrderDetailActions
                orderId={order.id}
                initialStatus={order.status}
                initialCarrier={order.carrier}
                initialTracking={order.trackingNumber}
                canManage={canManage}
              />
            </div>
          </Panel>

          {orderReturns.length > 0 && (
            <Panel
              title="Returns"
              description={`${orderReturns.length} return request${orderReturns.length === 1 ? "" : "s"} linked to this order`}
            >
              <ul className="divide-y divide-neutral-100">
                {orderReturns.map((r) => (
                  <li key={r.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <Link
                        href={`/admin/returns/${r.id}`}
                        className="font-mono text-sm font-semibold text-brand hover:underline"
                      >
                        {r.rmaNumber}
                      </Link>
                      <p className="mt-0.5 text-xs text-neutral-500">{r.reason}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <Panel title="Logistics & payment">
            <div className="space-y-3 p-5">
              <DetailGrid>
                <DetailItem label="Fulfillment">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${fulfillment.badgeClass}`}>
                    {fulfillment.label}
                  </span>
                  <p className="mt-1 text-xs text-neutral-500">{fulfillment.description}</p>
                </DetailItem>
                <DetailItem label="Courier selected">{order.courierName ?? order.carrier ?? "—"}</DetailItem>
                <DetailItem label="Payment method">{order.paymentMethod}</DetailItem>
                <DetailItem label="Tracking">{order.trackingNumber ?? "Not assigned"}</DetailItem>
              </DetailGrid>
            </div>
          </Panel>

          <Panel title="Customer">
            <div className="space-y-3 p-5">
              <DetailGrid>
                <DetailItem label="Name">{order.shippingAddress.fullName}</DetailItem>
                <DetailItem label="Email">
                  <Link href={`mailto:${order.shippingAddress.email}`} className="text-brand hover:underline">
                    {order.shippingAddress.email}
                  </Link>
                </DetailItem>
                <DetailItem label="Phone">{order.shippingAddress.phone ?? "—"}</DetailItem>
              </DetailGrid>
            </div>
          </Panel>

          <Panel title="Ship to">
            <div className="p-5 text-sm leading-relaxed text-neutral-700">
              <p className="font-medium text-neutral-950">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.province}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </Panel>

          <Panel title="Timeline">
            <div className="p-5">
              <Timeline events={order.timeline} />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
