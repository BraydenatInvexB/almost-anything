"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Order } from "@/types/cart";
import { useAuth } from "@/context/AuthProvider";
import { formatCurrency } from "@/lib/utils/cn";
import { customerStatus } from "@/lib/orders/status";

export default function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderNumber) return;
    fetch(`/api/orders?orderNumber=${encodeURIComponent(orderNumber)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.order) setOrder(data.order);
      })
      .catch(() => {});
  }, [orderNumber]);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6">
        <Card variant="elevated" className="bg-white p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-neutral-900">
            Order Confirmed!
          </h1>
          <p className="mt-2 text-neutral-500">
            Thank you for your purchase. We&apos;re getting your order ready and
            will have it on its way to you shortly.
          </p>

          {orderNumber ? (
            <div className="mt-6 rounded-2xl bg-neutral-50 px-6 py-4">
              <p className="text-sm text-neutral-500">Order number</p>
              <p className="mt-1 font-mono text-lg font-semibold">{orderNumber}</p>
            </div>
          ) : null}

          {order ? (
            <dl className="mt-6 space-y-2 text-left text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Total paid</dt>
                <dd className="font-semibold">{formatCurrency(order.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Status</dt>
                <dd>{customerStatus(order.status).label}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Items</dt>
                <dd>{order.items.length}</dd>
              </div>
            </dl>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={orderNumber ? `/track?order=${encodeURIComponent(orderNumber)}` : "/account/orders"}>
              <Button variant="secondary" className="w-full sm:w-auto">
                <Package className="h-4 w-4" />
                Track Order
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full sm:w-auto">
                Continue Shopping
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {!user && (
            <Card variant="default" className="mt-6 p-5 text-left">
              <p className="text-sm font-semibold text-neutral-900">Save your order history</p>
              <p className="mt-1 text-sm text-neutral-600">
                Create a free account to track this order and all future purchases in one place.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/signup?redirect=${encodeURIComponent("/account/orders")}`}>
                  <Button size="sm">Create account</Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="sm">Sign in</Button>
                </Link>
              </div>
            </Card>
          )}
        </Card>

        <Card variant="default" className="mt-6 p-6">
          <h2 className="font-semibold">What happens next?</h2>
          <ol className="mt-4 space-y-3 text-sm text-neutral-600">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs text-white">
                1
              </span>
              We confirm your order and get it ready for dispatch
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs text-white">
                2
              </span>
              Every item is quality checked before it leaves us
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs text-white">
                3
              </span>
              Shipped directly to your door with tracking
            </li>
          </ol>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
}
