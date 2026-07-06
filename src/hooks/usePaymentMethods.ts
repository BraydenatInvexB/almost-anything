"use client";

import { useCallback, useState } from "react";
import type { CustomerPaymentMethod } from "@/types/customer-payment-method";

export function usePaymentMethods(enabled: boolean) {
  const [methods, setMethods] = useState<CustomerPaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled) {
      setMethods([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/account/payment-methods");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load saved cards");
      setMethods(data.methods ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load saved cards");
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  return { methods, loading, error, refresh };
}
