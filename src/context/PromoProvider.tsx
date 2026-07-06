"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CartItem } from "@/types/cart";
import { useCart } from "@/context/CartProvider";

const STORAGE_KEY = "aa_applied_promo";

export interface AppliedPromo {
  code: string;
  promoId: string;
  discountAmount: number;
  eligibleSubtotal: number;
  discountedSubtotal: number;
}

interface PromoContextValue {
  applied: AppliedPromo | null;
  loading: boolean;
  error: string;
  applyCode: (code: string) => Promise<boolean>;
  clearPromo: () => void;
  discountAmount: number;
}

const PromoContext = createContext<PromoContextValue | null>(null);

function loadStoredPromo(): AppliedPromo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppliedPromo) : null;
  } catch {
    return null;
  }
}

function saveStoredPromo(promo: AppliedPromo | null) {
  if (typeof window === "undefined") return;
  if (promo) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(promo));
  else sessionStorage.removeItem(STORAGE_KEY);
}

async function validatePromo(code: string, items: CartItem[]) {
  const response = await fetch("/api/promo/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      items: items.map((item) => ({
        productId: item.productId,
        slug: item.slug,
        price: item.price,
        quantity: item.quantity,
      })),
    }),
  });
  return response.json();
}

export function PromoProvider({ children }: { children: React.ReactNode }) {
  const { items } = useCart();
  const [applied, setApplied] = useState<AppliedPromo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hydrated = useRef(false);
  const appliedCodeRef = useRef<string | null>(null);

  const syncPromo = useCallback(async (code: string, silent = false) => {
    if (!items.length) {
      setApplied(null);
      appliedCodeRef.current = null;
      saveStoredPromo(null);
      return null;
    }

    if (!silent) setLoading(true);
    setError("");

    try {
      const data = await validatePromo(code, items);
      if (!data.valid || !data.promoId) {
        setApplied(null);
        appliedCodeRef.current = null;
        saveStoredPromo(null);
        if (!silent) setError(data.message ?? "Invalid promo code");
        return null;
      }

      const next: AppliedPromo = {
        code: data.code,
        promoId: data.promoId,
        discountAmount: data.discountAmount,
        eligibleSubtotal: data.eligibleSubtotal,
        discountedSubtotal: data.discountedSubtotal,
      };
      setApplied(next);
      appliedCodeRef.current = next.code;
      saveStoredPromo(next);
      return next;
    } catch {
      if (!silent) setError("Could not validate promo code");
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [items]);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = loadStoredPromo();
    if (stored) {
      appliedCodeRef.current = stored.code;
      void syncPromo(stored.code, true);
    }
  }, [syncPromo]);

  useEffect(() => {
    if (!hydrated.current || !appliedCodeRef.current) return;
    void syncPromo(appliedCodeRef.current, true);
  }, [items, syncPromo]);

  const applyCode = useCallback(
    async (code: string) => {
      const result = await syncPromo(code, false);
      return Boolean(result);
    },
    [syncPromo],
  );

  const clearPromo = useCallback(() => {
    setApplied(null);
    appliedCodeRef.current = null;
    setError("");
    saveStoredPromo(null);
  }, []);

  const value = useMemo(
    () => ({
      applied,
      loading,
      error,
      applyCode,
      clearPromo,
      discountAmount: applied?.discountAmount ?? 0,
    }),
    [applied, loading, error, applyCode, clearPromo],
  );

  return <PromoContext.Provider value={value}>{children}</PromoContext.Provider>;
}

export function usePromo() {
  const ctx = useContext(PromoContext);
  if (!ctx) throw new Error("usePromo must be used within PromoProvider");
  return ctx;
}
