"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { OrderSuccessView } from "@/components/checkout/success/OrderSuccessView";
import type { Order } from "@/types/cart";
import { useAuth } from "@/context/AuthProvider";
import { useCart } from "@/context/CartProvider";

const CONFIRMED_STATUSES: Order["status"][] = [
  "paid",
  "sourcing",
  "purchased",
  "shipped",
  "delivered",
];

export default function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderNumber));

  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }

    fetch(`/api/orders?orderNumber=${encodeURIComponent(orderNumber)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.order) setOrder(data.order);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderNumber]);

  useEffect(() => {
    if (order && CONFIRMED_STATUSES.includes(order.status)) {
      clearCart();
    }
  }, [order, clearCart]);

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 sm:px-6">
        <SiteHeader variant="page" />
      </div>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <OrderSuccessView
          orderNumber={orderNumber}
          order={order}
          loading={loading}
          isGuest={!user}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
