"use client";

import { useCallback, useState } from "react";
import type { PaymentGateway } from "@/components/payments/PaymentGatewaySelector";

export function usePaymentGateway() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const startPayment = useCallback(async (input: { provider: PaymentGateway; purpose: "checkout" | "seller_subscription"; orderNumber?: string; sellerId?: string }) => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/payments/initialize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to start payment.");
      const form = document.createElement("form");
      form.method = "POST"; form.action = data.actionUrl;
      for (const [name, value] of Object.entries(data.fields as Record<string, string>)) {
        const field = document.createElement("input"); field.type = "hidden"; field.name = name; field.value = value; form.appendChild(field);
      }
      document.body.appendChild(form); form.submit();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start payment."); setLoading(false);
    }
  }, []);
  return { startPayment, loading, error };
}
