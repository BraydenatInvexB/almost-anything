"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PaymentPageShell } from "@/components/payments/PaymentPageShell";

function SellerSignupPaymentRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/seller/settings?onboarding=1");
  }, [router]);

  return (
    <PaymentPageShell
      backHref="/sell/register"
      backLabel="Back to registration"
      title="Application submitted"
      description="No upfront payment is required. Redirecting you to seller setup…"
    >
      <div className="flex justify-center py-6">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    </PaymentPageShell>
  );
}

export default function SellerSignupPaymentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-neutral-500">Loading…</div>}>
      <SellerSignupPaymentRedirect />
    </Suspense>
  );
}
