export type PaystackPaymentPurpose = "checkout" | "seller_signup" | "seller_subscription";

export type CheckoutPaymentMethod = "card" | "eft" | "demo";

/** Card verification charge during seller signup (ZAR). */
export const SELLER_CARD_VERIFICATION_ZAR = 5;

export const PAYSTACK_CURRENCY = "ZAR";

function readSecretKey(): string | undefined {
  return process.env.PAYSTACK_SECRET_KEY;
}

function readPublicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
}

function isRealKey(value: string | undefined): boolean {
  return Boolean(value && !value.includes("xxx") && value.length > 12);
}

/** Server-side: both keys must be valid Paystack keys. */
export function isPaystackConfigured(): boolean {
  const secret = readSecretKey();
  const publicKey = readPublicKey();
  return isRealKey(secret) && isRealKey(publicKey) && secret!.startsWith("sk_") && publicKey!.startsWith("pk_");
}

/** Why Paystack is unavailable — for API error messages. */
export function paystackConfigIssue(): string | null {
  if (isPaystackConfigured()) return null;
  const secret = readSecretKey();
  const publicKey = readPublicKey();
  if (!secret || !publicKey) {
    return "Paystack keys are missing from environment variables.";
  }
  if (secret.includes("xxx") || publicKey.includes("xxx")) {
    return "Replace Paystack placeholder keys (pk_test_xxx / sk_test_xxx) with your test keys from the Paystack dashboard.";
  }
  return "Paystack keys appear invalid.";
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
      return "Demo checkout (no charge)";
    default:
      return method;
  }
}

export function checkoutPaymentMethods(): { id: CheckoutPaymentMethod; label: string }[] {
  const methods: { id: CheckoutPaymentMethod; label: string }[] = [
    { id: "card", label: "Credit / debit card" },
    { id: "eft", label: "Instant EFT" },
  ];

  if (!isPaystackConfigured() && process.env.NODE_ENV === "development") {
    methods.push({ id: "demo", label: "Demo checkout (dev only)" });
  }

  return methods;
}
