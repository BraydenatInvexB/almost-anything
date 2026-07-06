"use client";

import { useCallback, useState } from "react";
import type { PaystackPaymentPurpose, CheckoutPaymentMethod } from "@/config/paystack";

interface StartPaymentInput {
  purpose: PaystackPaymentPurpose;
  orderNumber?: string;
  sellerId?: string;
  paymentMethod?: CheckoutPaymentMethod;
  saveCard?: boolean;
  savedPaymentMethodId?: string;
}

export function usePaystackPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startPayment = useCallback(async (input: StartPaymentInput) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Unable to start payment");
      }

      if (data.mode === "charged" && data.redirectUrl) {
        window.location.href = data.redirectUrl as string;
        return;
      }

      if (!data.authorizationUrl) {
        throw new Error("Paystack did not return a payment URL.");
      }

      window.location.href = data.authorizationUrl as string;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      setError(message);
      setLoading(false);
      throw err;
    }
  }, []);

  return { startPayment, loading, error, setError };
}

export async function verifyPaystackReference(reference: string) {
  const res = await fetch("/api/payments/paystack/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}
