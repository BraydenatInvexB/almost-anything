"use client";

import { AuthProvider } from "@/context/AuthProvider";
import { FeedbackProvider } from "@/context/FeedbackProvider";
import { CartProvider } from "@/context/CartProvider";
import { PromoProvider } from "@/context/PromoProvider";
import { FavoritesProvider } from "@/context/FavoritesProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FeedbackProvider>
        <CartProvider>
          <PromoProvider>
            <FavoritesProvider>{children}</FavoritesProvider>
          </PromoProvider>
        </CartProvider>
      </FeedbackProvider>
    </AuthProvider>
  );
}
