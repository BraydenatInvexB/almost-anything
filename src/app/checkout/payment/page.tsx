"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PaymentPageShell } from "@/components/payments/PaymentPageShell";
import { CheckoutPaymentPanel } from "@/components/checkout/CheckoutPaymentPanel";
import { useCart } from "@/context/CartProvider";
import type { Order } from "@/types/cart";
import type { CheckoutPaymentMethod } from "@/config/paystack";

function CheckoutPaymentContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const paymentMethod = (searchParams.get("method") ?? "card") as CheckoutPaymentMethod;
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!orderNumber) return;
    fetch(`/api/orders?orderNumber=${encodeURIComponent(orderNumber)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.order) {
          setOrder(data.order);
          if (data.order.status === "paid" || data.order.status === "sourcing") {
            clearCart();
          }
        } else {
          setLoadError("Order not found.");
        }
      })
      .catch(() => setLoadError("Unable to load order."));
  }, [orderNumber, clearCart]);

  if (!orderNumber) {
    return (
      <PaymentPageShell
        backHref="/checkout"
        backLabel="Back to checkout"
        title="Payment"
        description="Order reference is missing."
      >
        <p className="text-sm text-red-500">Missing order number.</p>
      </PaymentPageShell>
    );
  }

  return (
    <PaymentPageShell
      backHref="/checkout"
      backLabel="Back to checkout"
      title="Complete your payment"
      description="Review your order total, then pay securely with Paystack."
    >
      {loadError ? <p className="text-sm text-red-500">{loadError}</p> : null}
      {order ? (
        <CheckoutPaymentPanel order={order} paymentMethod={paymentMethod} />
      ) : (
        <p className="text-sm text-neutral-500">Loading order details…</p>
      )}
    </PaymentPageShell>
  );
}

export default function CheckoutPaymentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-neutral-500">Loading payment…</div>}>
      <CheckoutPaymentContent />
    </Suspense>
  );
}
