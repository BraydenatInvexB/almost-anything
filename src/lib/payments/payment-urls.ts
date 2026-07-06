function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    process.env.VERCEL_URL?.replace(/^/, "https://") ??
    "http://localhost:3000"
  );
}

export function paystackCallbackUrl(): string {
  return `${siteOrigin()}/payment/callback`;
}

export function checkoutPaymentPageUrl(orderNumber: string): string {
  return `/checkout/payment?orderNumber=${encodeURIComponent(orderNumber)}`;
}

export function sellerSignupPaymentPageUrl(sellerId: string): string {
  return `/sell/register/payment?sellerId=${encodeURIComponent(sellerId)}`;
}

export function sellerSubscriptionPaymentPageUrl(): string {
  return "/seller/subscription/payment";
}
