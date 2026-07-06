"use client";

import { useCallback, useEffect, useState } from "react";
import type { CustomerAddress } from "@/types/customer-address";

export function useSavedAddresses(enabled: boolean) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/account/addresses");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Could not load saved addresses");
      }
      setAddresses(data.addresses ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load saved addresses");
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { addresses, loading, error, refresh };
}
