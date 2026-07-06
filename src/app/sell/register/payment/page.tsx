"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentPageShell } from "@/components/payments/PaymentPageShell";
import { PaymentSummaryCard } from "@/components/payments/PaymentSummaryCard";
import { PaystackRedirectPanel } from "@/components/payments/PaystackRedirectPanel";
import { usePaystackPayment } from "@/hooks/usePaystackPayment";
import { SELLER_CARD_VERIFICATION_ZAR } from "@/config/paystack";
import { SELLER_PLAN_BY_ID } from "@/config/seller-plans";
import { formatCurrency } from "@/lib/utils/cn";
import type { SellerPlan } from "@/types/seller";

function SellerSignupPaymentContent() {
  const searchParams = useSearchParams();
  const sellerId = searchParams.get("sellerId");
  const { startPayment, loading, error } = usePaystackPayment();
  const [planLabel, setPlanLabel] = useState("");

  useEffect(() => {
    const plan = searchParams.get("plan") as SellerPlan | null;
    if (plan && SELLER_PLAN_BY_ID[plan]) {
      setPlanLabel(`${SELLER_PLAN_BY_ID[plan].name} · R${SELLER_PLAN_BY_ID[plan].priceMonthly}/mo`);
    }
  }, [searchParams]);

  async function handlePay() {
    if (!sellerId) return;
    await startPayment({ purpose: "seller_signup", sellerId });
  }

  if (!sellerId) {
    return (
      <PaymentPageShell
        backHref="/sell/register"
        backLabel="Back to registration"
        title="Seller payment setup"
        description="Seller reference is missing."
      >
        <p className="text-sm text-red-500">Missing seller id.</p>
      </PaymentPageShell>
    );
  }

  return (
    <PaymentPageShell
      backHref="/sell/register"
      backLabel="Back to registration"
      title="Verify your payment method"
      description="Secure your seller account with Paystack. Subscription billing only starts when you make your first sale."
    >
      <PaymentSummaryCard
        rows={[
          { label: "Purpose", value: "Payment method verification" },
          { label: "Selected plan", value: planLabel || "Seller plan" },
          { label: "Verification charge", value: formatCurrency(SELLER_CARD_VERIFICATION_ZAR) },
        ]}
        totalLabel="Due now"
        total={SELLER_CARD_VERIFICATION_ZAR}
      />

      <div className="mt-6">
        <PaystackRedirectPanel
          loading={loading}
          error={error}
          onPay={handlePay}
          payLabel={`Verify with Paystack · ${formatCurrency(SELLER_CARD_VERIFICATION_ZAR)}`}
          secureNote="This small verification charge confirms your card. Your monthly plan fee is only billed after your first customer order."
        />
      </div>
    </PaymentPageShell>
  );
}

export default function SellerSignupPaymentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-neutral-500">Loading…</div>}>
      <SellerSignupPaymentContent />
    </Suspense>
  );
}
