"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { verifyPaystackReference } from "@/hooks/usePaystackPayment";

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Confirming your payment…");

  useEffect(() => {
    const reference =
      searchParams.get("reference") ??
      searchParams.get("trxref");

    if (!reference) {
      router.replace("/payment/failed?reason=missing_reference");
      return;
    }

    verifyPaystackReference(reference)
      .then(({ ok, data }) => {
        if (ok && data.redirectUrl) {
          router.replace(data.redirectUrl as string);
          return;
        }
        router.replace(
          (data.redirectUrl as string | undefined) ??
            `/payment/failed?reference=${encodeURIComponent(reference)}`,
        );
      })
      .catch(() => {
        setMessage("Verification failed. Redirecting…");
        router.replace(`/payment/failed?reference=${encodeURIComponent(reference)}`);
      });
  }, [router, searchParams]);

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
