import { ArrowLeft } from "lucide-react";
import { PaymentStatusCard } from "@/components/payments/PaymentStatusCard";

export default function PaymentCancelledPage() {
  return (
    <PaymentStatusCard
      icon={<ArrowLeft className="h-8 w-8 text-neutral-600" />}
      title="Payment cancelled"
      description="You cancelled the Paystack payment. No charge was made — you can resume whenever you're ready."
      primaryHref="/checkout"
      primaryLabel="Back to checkout"
      secondaryHref="/"
      secondaryLabel="Continue shopping"
    />
  );
}
