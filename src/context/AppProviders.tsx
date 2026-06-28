"use client";

import { AuthProvider } from "@/context/AuthProvider";
import { FeedbackProvider } from "@/context/FeedbackProvider";
import { CartProvider } from "@/context/CartProvider";
import { FavoritesProvider } from "@/context/FavoritesProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FeedbackProvider>
        <CartProvider>
          <FavoritesProvider>{children}</FavoritesProvider>
        </CartProvider>
      </FeedbackProvider>
    </AuthProvider>
  );
}
