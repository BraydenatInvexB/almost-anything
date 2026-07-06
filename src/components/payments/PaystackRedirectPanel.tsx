"use client";

import { Button } from "@/components/ui/Button";
import { isPaystackConfigured } from "@/config/paystack";

export function PaystackRedirectPanel({
  loading,
  error,
  onPay,
  payLabel,
  secureNote,
}: {
  loading: boolean;
  error?: string;
  onPay: () => void;
  payLabel: string;
  secureNote: string;
}) {
  const configured = isPaystackConfigured();

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600">{secureNote}</p>

      {!configured ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Paystack is not configured yet. Add your keys to <code className="text-xs">.env.local</code>.
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <Button
        type="button"
        className="w-full rounded-full"
        isLoading={loading}
        disabled={!configured}
        onClick={() => void onPay()}
      >
        {payLabel}
      </Button>

      <p className="text-center text-xs text-neutral-400">
        You&apos;ll be redirected to Paystack to complete payment securely.
      </p>
    </div>
  );
}
