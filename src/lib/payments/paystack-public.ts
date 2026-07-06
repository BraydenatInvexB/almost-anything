/** Client-safe Paystack checks (public key only). */

import type { CheckoutPaymentMethod } from "@/config/paystack";

export function isPaystackPublicKeyReady(): boolean {
  const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  return Boolean(key && key.startsWith("pk_") && !key.includes("xxx"));
}

export function paystackPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  if (!key || key.includes("xxx")) return null;
  return key;
}

export function checkoutPaymentMethodsClient(): { id: CheckoutPaymentMethod; label: string }[] {
  const methods: { id: CheckoutPaymentMethod; label: string }[] = [
    { id: "card", label: "Credit / debit card" },
    { id: "eft", label: "Instant EFT" },
  ];

  if (process.env.NODE_ENV === "development" && !isPaystackPublicKeyReady()) {
    methods.push({ id: "demo", label: "Demo checkout (dev only)" });
  }

  return methods;
}
