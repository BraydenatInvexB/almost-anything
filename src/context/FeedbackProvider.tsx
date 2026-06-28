"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface FeedbackContextValue {
  cartPulseKey: number;
  wishlistPulseKey: number;
  pulseCart: () => void;
  pulseWishlist: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [cartPulseKey, setCartPulseKey] = useState(0);
  const [wishlistPulseKey, setWishlistPulseKey] = useState(0);

  const pulseCart = useCallback(() => {
    setCartPulseKey((k) => k + 1);
  }, []);

  const pulseWishlist = useCallback(() => {
    setWishlistPulseKey((k) => k + 1);
  }, []);

  const value = useMemo(
    () => ({ cartPulseKey, wishlistPulseKey, pulseCart, pulseWishlist }),
    [cartPulseKey, wishlistPulseKey, pulseCart, pulseWishlist],
  );

  return (
    <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used within FeedbackProvider");
  return ctx;
}
