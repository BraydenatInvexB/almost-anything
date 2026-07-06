export type PaystackPaymentPurpose = "checkout" | "seller_signup" | "seller_subscription";

export type CheckoutPaymentMethod = "card" | "eft" | "demo";

/** Card verification charge during seller signup (ZAR). Refunded manually or via support. */
export const SELLER_CARD_VERIFICATION_ZAR = 5;

export const PAYSTACK_CURRENCY = "ZAR";

export function isPaystackConfigured(): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  return Boolean(
    secret &&
      publicKey &&
      !secret.includes("xxx") &&
      !publicKey.includes("xxx"),
  );
}

export function paystackChannels(method: CheckoutPaymentMethod): string[] | undefined {
  if (method === "eft") return ["bank"];
  if (method === "card") return ["card"];
  return undefined;
}

export function paymentMethodLabel(method: CheckoutPaymentMethod): string {
  switch (method) {
    case "card":
      return "Credit / debit card";
    case "eft":
      return "Instant EFT";
    case "demo":
      return "Demo checkout";
    default:
      return method;
  }
}

export const CHECKOUT_PAYMENT_METHODS: { id: CheckoutPaymentMethod; label: string }[] = [
  { id: "card", label: "Credit / debit card" },
  { id: "eft", label: "Instant EFT" },
  ...(process.env.NODE_ENV === "development"
    ? [{ id: "demo" as const, label: "Demo checkout" }]
    : []),
];
