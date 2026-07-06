"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const reason = searchParams.get("reason");

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16 sm:px-6">
        <Card variant="elevated" className="bg-white p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-neutral-900">Payment not completed</h1>
          <p className="mt-2 text-sm text-neutral-600">
            {reason === "missing_reference"
              ? "We could not find a payment reference to verify."
              : "Your payment was not completed or could not be verified. You can try again safely."}
          </p>
          {reference ? (
            <p className="mt-4 font-mono text-xs text-neutral-400">Ref: {reference}</p>
          ) : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/checkout">
              <Button className="w-full rounded-full sm:w-auto">Return to checkout</Button>
            </Link>
            <Link href="/">
              <Button variant="secondary" className="w-full rounded-full sm:w-auto">
                Continue shopping
              </Button>
            </Link>
          </div>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-neutral-500">Loading…</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
