"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PaymentGatewaySelector, type PaymentGateway } from "@/components/payments/PaymentGatewaySelector";

export function PaymentRedirectPanel({
  loading,
  error,
  onPay,
  payLabel,
  secureNote,
  gateway: controlledGateway,
  onGatewayChange,
}: {
  loading: boolean;
  error?: string;
  onPay: (gateway: PaymentGateway) => void;
  payLabel: string;
  secureNote: string;
  gateway?: PaymentGateway;
  onGatewayChange?: (gateway: PaymentGateway) => void;
}) {
  const [localGateway, setLocalGateway] = useState<PaymentGateway>("payfast");
  const gateway = controlledGateway ?? localGateway;
  const setGateway = onGatewayChange ?? setLocalGateway;

  return (
    <div className="space-y-4">
      <PaymentGatewaySelector value={gateway} onChange={setGateway} />
      <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">{secureNote}</p>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <Button type="button" className="w-full rounded-full" isLoading={loading} onClick={() => void onPay(gateway)}>
        {payLabel} with {gateway === "payfast" ? "PayFast" : "Ozow"}
      </Button>
      <p className="text-center text-xs text-neutral-400">
        You&apos;ll continue to {gateway === "payfast" ? "PayFast" : "Ozow"} only for secure payment authorization.
      </p>
    </div>
  );
}
