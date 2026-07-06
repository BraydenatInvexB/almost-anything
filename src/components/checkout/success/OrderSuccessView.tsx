import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/cn";
import { customerStatus, TRACK_STEPS } from "@/lib/orders/status";
import { formatOrderShippingAddress } from "@/lib/utils/format-shipping-address";
import type { Order } from "@/types/cart";

function OrderProgress({ status }: { status: Order["status"] }) {
  const { step } = customerStatus(status);
  if (step < 0) return null;

  return (
    <div className="mt-8">
      <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-neutral-500">
        Delivery progress
      </p>
      <div className="flex items-center gap-1">
        {TRACK_STEPS.map((label, index) => {
          const done = index <= step;
          const active = index === step;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-black text-[10px] font-extrabold ${
                  done ? "bg-brand text-white shadow-[2px_2px_0_0_#000]" : "bg-white text-neutral-400"
                } ${active ? "ring-2 ring-brand/30 ring-offset-2" : ""}`}
              >
                {index + 1}
              </span>
              <span
                className={`hidden text-center text-[10px] font-semibold uppercase leading-tight sm:block ${
                  done ? "text-neutral-900" : "text-neutral-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderLinePreview({ items }: { items: Order["items"] }) {
  if (!items.length) return null;
  const [first, ...rest] = items;

  return (
    <div className="mt-6 rounded-2xl border-2 border-black bg-neutral-50 p-4 text-left">
      <p className="text-xs font-extrabold uppercase tracking-wide text-neutral-500">In your order</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-black bg-white">
          {first.imageUrl ? (
            <Image src={first.imageUrl} alt={first.name} fill className="object-cover" sizes="56px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-5 w-5 text-neutral-400" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-neutral-900">{first.name}</p>
          <p className="text-sm text-neutral-500">
            Qty {first.quantity}
            {rest.length ? ` · +${rest.length} more item${rest.length === 1 ? "" : "s"}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

interface OrderSuccessViewProps {
  orderNumber: string | null;
  order: Order | null;
  loading: boolean;
  isGuest: boolean;
}

export function OrderSuccessView({ orderNumber, order, loading, isGuest }: OrderSuccessViewProps) {
  const statusMeta = order ? customerStatus(order.status) : null;
  const trackHref = orderNumber ? `/track?order=${encodeURIComponent(orderNumber)}` : "/account/orders";

  return (
    <>
      <div className="overflow-hidden rounded-[28px] border-[3px] border-black bg-white shadow-[8px_8px_0_0_#000]">
        <div className="h-2 border-b-[3px] border-black bg-brand" />

        <div className="p-8 text-center sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-black bg-[#E8F9EE] shadow-[4px_4px_0_0_#000]">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" strokeWidth={2.5} />
          </span>

          <h1 className="mt-5 text-3xl font-black uppercase tracking-tight text-neutral-900 sm:text-4xl">
            Order confirmed
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-500">
            Thank you for your purchase. We&apos;re preparing your order and will notify you when it
            ships.
          </p>

          {orderNumber ? (
            <div className="mx-auto mt-6 inline-flex flex-col items-center rounded-2xl border-2 border-black bg-neutral-50 px-8 py-4 shadow-[3px_3px_0_0_#000]">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500">
                Order number
              </span>
              <span className="mt-1 font-mono text-xl font-bold tracking-wide text-neutral-900">
                {orderNumber}
              </span>
            </div>
          ) : null}

          {loading && !order ? (
            <div className="mx-auto mt-8 h-24 max-w-sm animate-pulse rounded-2xl bg-neutral-100" />
          ) : null}

          {order && statusMeta ? (
            <>
              <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
                <div className="rounded-xl border-2 border-black bg-white p-4 shadow-[2px_2px_0_0_#000]">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-neutral-500">Total paid</p>
                  <p className="mt-1 text-lg font-bold text-neutral-900">{formatCurrency(order.total)}</p>
                </div>
                <div className="rounded-xl border-2 border-black bg-white p-4 shadow-[2px_2px_0_0_#000]">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-neutral-500">Status</p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${statusMeta.badge}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>
                <div className="rounded-xl border-2 border-black bg-white p-4 shadow-[2px_2px_0_0_#000] sm:col-span-2">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-neutral-500">Delivery</p>
                  <div className="mt-1 flex items-start gap-1.5 text-sm font-semibold text-neutral-900">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0" />
                    <address className="not-italic leading-snug">
                      {formatOrderShippingAddress(order.shippingAddress).map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </address>
                  </div>
                </div>
              </div>

              <OrderLinePreview items={order.items} />
              <OrderProgress status={order.status} />
            </>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={trackHref} className="sm:flex-1 sm:max-w-[200px]">
              <Button variant="secondary" className="w-full rounded-xl">
                <Package className="h-4 w-4" />
                Track order
              </Button>
            </Link>
            <Link href="/products" className="sm:flex-1 sm:max-w-[220px]">
              <Button className="w-full rounded-xl">
                Continue shopping
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isGuest ? (
            <div className="mt-8 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-5 text-left">
              <p className="font-semibold text-neutral-900">Save your order history</p>
              <p className="mt-1 text-sm text-neutral-600">
                Create a free account to track this order and all future purchases in one place.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/signup?redirect=${encodeURIComponent("/account/orders")}`}>
                  <Button size="sm" className="rounded-lg">
                    Create account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="sm" className="rounded-lg">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
