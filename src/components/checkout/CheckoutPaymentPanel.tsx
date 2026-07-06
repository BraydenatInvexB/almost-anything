"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentSummaryCard } from "@/components/payments/PaymentSummaryCard";
import { PaystackRedirectPanel } from "@/components/payments/PaystackRedirectPanel";
import { SavedCardPicker } from "@/components/checkout/SavedCardPicker";
import { usePaystackPayment } from "@/hooks/usePaystackPayment";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useAuth } from "@/context/AuthProvider";
import { useCart } from "@/context/CartProvider";
import { formatCurrency } from "@/lib/utils/cn";
import type { Order } from "@/types/cart";
import type { CheckoutPaymentMethod } from "@/config/paystack";

export function CheckoutPaymentPanel({
  order,
  paymentMethod,
}: {
  order: Order;
  paymentMethod: CheckoutPaymentMethod;
}) {
  const router = useRouter();
  const { user, isConfigured } = useAuth();
  const { clearCart } = useCart();
  const { startPayment, loading, error } = usePaystackPayment();
  const { methods, loading: cardsLoading, refresh } = usePaymentMethods(
    Boolean(user && isConfigured && paymentMethod === "card"),
  );
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState(true);

  useEffect(() => {
    if (user && isConfigured) void refresh();
  }, [user, isConfigured, refresh]);

  useEffect(() => {
    const defaultCard = methods.find((m) => m.isDefault) ?? methods[0];
    setSavedCardId(defaultCard?.id ?? null);
  }, [methods]);

  async function handlePay() {
    await startPayment({
      purpose: "checkout",
      orderNumber: order.orderNumber,
      paymentMethod,
      saveCard: savedCardId ? false : saveCard,
      savedPaymentMethodId: savedCardId ?? undefined,
    });
  }

  if (order.status === "paid" || order.status === "sourcing") {
    clearCart();
    router.replace(`/checkout/success?orderNumber=${encodeURIComponent(order.orderNumber)}`);
    return null;
  }

  const useSavedCard = paymentMethod === "card" && savedCardId;

  return (
    <>
      <PaymentSummaryCard
        rows={[
          { label: "Order", value: order.orderNumber },
          { label: "Items", value: String(order.items.length) },
          { label: "Subtotal", value: formatCurrency(order.subtotal, order.currency) },
          {
            label: "Delivery",
            value: order.shipping === 0 ? "Free" : formatCurrency(order.shipping, order.currency),
          },
          { label: "VAT", value: formatCurrency(order.tax, order.currency) },
        ]}
        totalLabel="Total due"
        total={order.total}
        currency={order.currency}
      />

      <div className="mt-6 space-y-4">
        {paymentMethod === "card" && user && isConfigured ? (
          cardsLoading ? (
            <p className="text-sm text-neutral-500">Loading saved cards…</p>
          ) : (
            <SavedCardPicker methods={methods} selectedId={savedCardId} onSelect={setSavedCardId} />
          )
        ) : null}

        {paymentMethod === "card" && user && isConfigured && !savedCardId ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="rounded border-neutral-300"
            />
            Save this card for future orders
          </label>
        ) : null}

        <PaystackRedirectPanel
          loading={loading}
          error={error}
          onPay={handlePay}
          payLabel={
            useSavedCard
              ? `Pay ${formatCurrency(order.total, order.currency)} with saved card`
              : `Pay ${formatCurrency(order.total, order.currency)} with Paystack`
          }
          secureNote={
            useSavedCard
              ? "Your saved card will be charged securely via Paystack."
              : "Your card or bank details are processed by Paystack. We never store your full card number."
          }
        />
      </div>
    </>
  );
}
