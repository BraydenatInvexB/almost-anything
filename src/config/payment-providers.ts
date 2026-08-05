export type PaymentProvider = "payfast" | "ozow";
export type PaymentPurpose = "checkout" | "seller_subscription";

export function paymentProviderIssue(provider: PaymentProvider): string | null {
  if (provider === "payfast") {
    if (process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_MERCHANT_KEY && process.env.PAYFAST_PASSPHRASE) return null;
    return "PayFast merchant credentials are not configured.";
  }
  if (process.env.OZOW_SITE_CODE && process.env.OZOW_PRIVATE_KEY && process.env.OZOW_API_KEY) return null;
  return "Ozow merchant credentials are not configured.";
}

export function paymentsTestMode(): boolean {
  return process.env.PAYMENTS_TEST_MODE !== "false";
}
