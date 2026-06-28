import { Suspense } from "react";
import CheckoutSuccessContent from "./CheckoutSuccessContent";

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F4EEE1]">
          <p className="text-neutral-500">Loading order...</p>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
