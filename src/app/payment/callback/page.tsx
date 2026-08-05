"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { useCart } from "@/context/CartProvider";

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [message, setMessage] = useState("Confirming your payment…");

  useEffect(() => {
    const reference = searchParams.get("reference");

    if (!reference) {
      router.replace("/payment/failed?reason=missing_reference");
      return;
    }
    const paymentReference = reference;

    let cancelled = false;
    async function confirmPayment() {
      for (let attempt = 0; attempt < 12 && !cancelled; attempt += 1) {
        const response = await fetch(`/api/payments/status?reference=${encodeURIComponent(paymentReference)}`, { cache: "no-store" });
        const data = await response.json();
        if (response.ok && data.paid && data.redirectUrl) {
          clearCart();
          router.replace(data.redirectUrl as string);
          return;
        }
        setMessage("Payment received. Waiting for secure confirmation…");
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }
      if (!cancelled) router.replace(`/payment/failed?reference=${encodeURIComponent(paymentReference)}&reason=pending_confirmation`);
    }
    void confirmPayment().catch(() => {
      if (!cancelled) router.replace(`/payment/failed?reference=${encodeURIComponent(paymentReference)}`);
    });
    return () => { cancelled = true; };
  }, [router, searchParams, clearCart]);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="mt-4 text-sm text-neutral-600">{message}</p>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-neutral-500">Processing…</div>}>
      <PaymentCallbackContent />
    </Suspense>
  );
}
