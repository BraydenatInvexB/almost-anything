"use client";

import { useRouter } from "next/navigation";
import { PaymentSummaryCard } from "@/components/payments/PaymentSummaryCard";
import { PaymentRedirectPanel } from "@/components/payments/PaymentRedirectPanel";
import type { PaymentGateway } from "@/components/payments/PaymentGatewaySelector";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";
import { useCart } from "@/context/CartProvider";
import { formatCurrency } from "@/lib/utils/cn";
import type { Order } from "@/types/cart";

export function CheckoutPaymentPanel({
  order,
}: {
  order: Order;
  paymentMethod?: string;
}) {
  const router = useRouter();
  const { clearCart } = useCart();
  const { startPayment, loading, error } = usePaymentGateway();

  async function handlePay(provider: PaymentGateway) {
    await startPayment({
      provider,
      purpose: "checkout",
      orderNumber: order.orderNumber,
    });
  }

  if (order.status === "paid" || order.status === "sourcing") {
    clearCart();
    router.replace(`/checkout/success?orderNumber=${encodeURIComponent(order.orderNumber)}`);
    return null;
  }

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
        <PaymentRedirectPanel
          loading={loading}
          error={error}
          onPay={handlePay}
          payLabel={`Pay ${formatCurrency(order.total, order.currency)}`}
          secureNote="Choose PayFast for card and supported payment methods, or Ozow for secure instant EFT. Almost Anything never stores your full banking or card details."
        />
      </div>
    </>
  );
}
