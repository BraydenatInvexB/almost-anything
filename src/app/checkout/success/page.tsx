import { Suspense } from "react";
import CheckoutSuccessContent from "./CheckoutSuccessContent";

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-50">
          <div className="h-48 w-full max-w-md animate-pulse rounded-[28px] border-[3px] border-neutral-200 bg-white" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
