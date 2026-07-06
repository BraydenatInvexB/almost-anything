"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { PaymentStatusCard } from "@/components/payments/PaymentStatusCard";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const reason = searchParams.get("reason");

  const description =
    reason === "missing_reference"
      ? "We could not find a payment reference to verify."
      : "Your payment was not completed or could not be verified. You can try again safely.";

  return (
    <PaymentStatusCard
      icon={<XCircle className="h-8 w-8 text-red-600" />}
      title="Payment not completed"
      description={description}
      reference={reference}
      primaryHref="/checkout"
      primaryLabel="Return to checkout"
      secondaryHref="/"
      secondaryLabel="Continue shopping"
    />
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-neutral-500">Loading…</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
