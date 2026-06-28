"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthProvider";
import type { Order } from "@/types/cart";
import { formatCurrency } from "@/lib/utils/cn";
import { customerStatus } from "@/lib/orders/status";

export default function OrdersPage() {
  const { user, isConfigured } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!user || !isConfigured) return;

    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setFetched(true));
  }, [user, isConfigured]);

  const loading = Boolean(user && isConfigured && !fetched);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-neutral-900">Order History</h1>

        {!user ? (
          <Card variant="elevated" className="mt-8 bg-white p-8 text-center">
            <p className="text-neutral-500">Sign in to view your orders.</p>
            <Link href="/login" className="mt-4 inline-block">
              <Button>Sign In</Button>
            </Link>
          </Card>
        ) : loading ? (
          <p className="mt-8 text-neutral-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <Card variant="elevated" className="mt-8 bg-white py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-4 font-medium">No orders yet</p>
            <p className="mt-2 text-sm text-neutral-500">
              Orders placed while signed in will appear here.
            </p>
            <Link href="/products" className="mt-6 inline-block">
              <Button>Start Shopping</Button>
            </Link>
          </Card>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <Card key={order.id} variant="elevated" className="bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm font-semibold">
                      {order.orderNumber}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge className={customerStatus(order.status).badge}>
                    {customerStatus(order.status).label}
                  </Badge>
                </div>

                <ul className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between text-sm text-neutral-600"
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
                  <span className="font-semibold">
                    Total {formatCurrency(order.total)}
                  </span>
                  <Link href={`/track?order=${encodeURIComponent(order.orderNumber)}`}>
                    <Button variant="secondary" size="sm" className="rounded-full">
                      Track order
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
