"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentPageShell } from "@/components/payments/PaymentPageShell";
import { PaymentSummaryCard } from "@/components/payments/PaymentSummaryCard";
import { PaystackRedirectPanel } from "@/components/payments/PaystackRedirectPanel";
import { usePaystackPayment } from "@/hooks/usePaystackPayment";
import { useCart } from "@/context/CartProvider";
import { formatCurrency } from "@/lib/utils/cn";
import type { Order } from "@/types/cart";
import type { CheckoutPaymentMethod } from "@/config/paystack";

function CheckoutPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const paymentMethod = (searchParams.get("method") ?? "card") as CheckoutPaymentMethod;
  const { clearCart } = useCart();
  const { startPayment, loading, error } = usePaystackPayment();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!orderNumber) return;
    fetch(`/api/orders?orderNumber=${encodeURIComponent(orderNumber)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.order) setOrder(data.order);
        else setLoadError("Order not found.");
      })
      .catch(() => setLoadError("Unable to load order."));
  }, [orderNumber]);

  useEffect(() => {
    if (order?.status === "paid" || order?.status === "sourcing") {
      clearCart();
      router.replace(`/checkout/success?orderNumber=${encodeURIComponent(order.orderNumber)}`);
    }
  }, [order, clearCart, router]);

  async function handlePay() {
    if (!orderNumber) return;
    await startPayment({ purpose: "checkout", orderNumber, paymentMethod });
  }

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
      description="Review your order total, then continue to Paystack to pay securely."
    >
      {loadError ? <p className="text-sm text-red-500">{loadError}</p> : null}

      {order ? (
        <>
          <PaymentSummaryCard
            rows={[
              { label: "Order", value: order.orderNumber },
              { label: "Items", value: String(order.items.length) },
              { label: "Subtotal", value: formatCurrency(order.subtotal, order.currency) },
              { label: "Delivery", value: order.shipping === 0 ? "Free" : formatCurrency(order.shipping, order.currency) },
              { label: "VAT", value: formatCurrency(order.tax, order.currency) },
            ]}
            totalLabel="Total due"
            total={order.total}
            currency={order.currency}
          />

          <div className="mt-6">
            <PaystackRedirectPanel
              loading={loading}
              error={error}
              onPay={handlePay}
              payLabel={`Pay ${formatCurrency(order.total, order.currency)} with Paystack`}
              secureNote="Your card or bank details are processed by Paystack. We never store your full payment credentials."
            />
          </div>
        </>
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
