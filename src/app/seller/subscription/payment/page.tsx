"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { PaymentPageShell } from "@/components/payments/PaymentPageShell";
import { PaymentSummaryCard } from "@/components/payments/PaymentSummaryCard";
import { PaystackRedirectPanel } from "@/components/payments/PaystackRedirectPanel";
import { usePaystackPayment } from "@/hooks/usePaystackPayment";
import { SELLER_PLANS } from "@/config/seller-plans";
import { formatCurrency } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import type { SellerPlan } from "@/types/seller";

interface SellerPaymentSummary {
  id: string;
  plan: SellerPlan;
  subscriptionStatus: string;
}

function SellerSubscriptionPaymentContent() {
  const { startPayment, loading, error } = usePaystackPayment();
  const [seller, setSeller] = useState<SellerPaymentSummary | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch("/api/seller/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.seller) {
          setSeller({
            id: data.seller.id,
            plan: data.seller.plan,
            subscriptionStatus: data.seller.subscriptionStatus,
          });
        } else {
          setLoadError("Sign in as a seller to manage billing.");
        }
      })
      .catch(() => setLoadError("Unable to load seller account."));
  }, []);

  const planConfig = seller ? SELLER_PLANS.find((p) => p.id === seller.plan) : null;

  async function handlePay() {
    if (!seller) return;
    await startPayment({ purpose: "seller_subscription", sellerId: seller.id });
  }

  if (loadError) {
    return (
      <PaymentPageShell
        backHref="/seller/subscription"
        backLabel="Back to subscription"
        title="Pay subscription"
        description={loadError}
      >
        <Link href="/seller/login?redirect=/seller/subscription/payment">
          <Button className="rounded-full">Seller sign in</Button>
        </Link>
      </PaymentPageShell>
    );
  }

  return (
    <PaymentPageShell
      backHref="/seller/subscription"
      backLabel="Back to subscription"
      title="Pay your subscription"
      description="Settle your seller plan for the current billing period via Paystack."
    >
      {planConfig && seller ? (
        <>
          <PaymentSummaryCard
            rows={[
              { label: "Plan", value: planConfig.name },
              { label: "Status", value: seller.subscriptionStatus },
              { label: "Billing period", value: "Monthly" },
            ]}
            totalLabel="Amount due"
            total={planConfig.priceMonthly}
          />

          <div className="mt-6">
            <PaystackRedirectPanel
              loading={loading}
              error={error}
              onPay={handlePay}
              payLabel={`Pay ${formatCurrency(planConfig.priceMonthly)} with Paystack`}
              secureNote="Subscription payments are processed securely by Paystack."
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-neutral-500">Loading subscription details…</p>
      )}
    </PaymentPageShell>
  );
}

export default function SellerSubscriptionPaymentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-neutral-500">Loading…</div>}>
      <SellerSubscriptionPaymentContent />
    </Suspense>
  );
}
