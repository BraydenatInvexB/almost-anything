import { getCurrentSeller } from "@/services/seller-service";
import { listSellerOrders, type SellerOrderSummary } from "@/services/seller/orders";
import { SellerDeliveryActions } from "@/components/seller/SellerDeliveryActions";
import { SellerOrderCostBreakdown } from "@/components/seller/SellerOrderCostBreakdown";
import { DeliveryJobSizeBadge } from "@/components/delivery/DeliveryJobSizeBadge";
import { formatCurrency } from "@/lib/utils/cn";

export default async function SellerOrdersPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const orders = await listSellerOrders(seller.id, 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Orders & deliveries</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          See what the customer paid for your goods and delivery. When the cart is only from your
          store, you handle delivery yourself.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg font-semibold text-neutral-900">No orders yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
              When customers buy your products, each order will show goods, delivery fee, and totals
              here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {orders.map((order) => (
              <SellerOrderRow key={order.orderId} order={order} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SellerOrderRow({ order }: { order: SellerOrderSummary }) {
  const c = order.currency || "ZAR";

  return (
    <li className="grid gap-4 p-4 lg:grid-cols-[1fr_minmax(220px,280px)] lg:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-neutral-900">{order.orderNumber}</p>
          <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-neutral-700">
            {order.status}
          </span>
          {order.delivery ? (
            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              {order.delivery.statusLabel}
            </span>
          ) : null}
        </div>

        <p className="mt-1 text-sm text-neutral-600">
          {order.customerName ?? "Customer"}
          {order.delivery?.customerPhone ? ` · ${order.delivery.customerPhone}` : ""}
        </p>
        {order.delivery?.addressLine ? (
          <p className="mt-1 text-xs text-neutral-500">{order.delivery.addressLine}</p>
        ) : null}

        <ul className="mt-3 space-y-1 text-sm text-neutral-700">
          {order.lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">
                {line.quantity}× {line.name}
              </span>
              <span className="shrink-0 tabular-nums text-neutral-500">
                {formatCurrency(line.lineTotal, c)}
              </span>
            </li>
          ))}
        </ul>

        {order.delivery ? (
          <DeliveryJobSizeBadge
            label={order.delivery.deliverySizeLabel}
            vehicleHint={order.delivery.vehicleHint}
            mayNeedTwoPeople={order.delivery.mayNeedTwoPeople}
          />
        ) : null}

        <SellerOrderCostBreakdown order={order} />
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:items-end lg:items-stretch">
        <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-right sm:text-left lg:text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            Your goods
          </p>
          <p className="text-lg font-bold tabular-nums text-neutral-900">
            {formatCurrency(order.goodsSubtotal, c)}
          </p>
          {order.deliveryFee > 0 ? (
            <p className="mt-0.5 text-xs text-neutral-500">
              + {formatCurrency(order.deliveryFee, c)} delivery
              {order.isSellerDelivery ? " (you deliver)" : ""}
            </p>
          ) : null}
        </div>

        {order.isSellerDelivery && order.delivery ? (
          <SellerDeliveryActions jobId={order.delivery.jobId} status={order.delivery.status} />
        ) : null}
      </div>
    </li>
  );
}
