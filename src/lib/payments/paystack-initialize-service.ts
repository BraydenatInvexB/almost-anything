import "server-only";
import { z } from "zod";
import {
  isPaystackConfigured,
  paystackChannels,
  SELLER_CARD_VERIFICATION_ZAR,
  type PaystackPaymentPurpose,
} from "@/config/paystack";
import { SELLER_PLAN_BY_ID } from "@/config/seller-plans";
import { createPaystackReference } from "@/lib/payments/paystack-reference";
import { initializePaystackTransaction } from "@/lib/payments/paystack-client";
import { paystackCallbackUrl } from "@/lib/payments/payment-urls";
import { initializeCheckoutPayment } from "@/lib/payments/checkout-payment";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SellerPlan } from "@/types/seller";
import type { initializePaymentSchema } from "@/lib/validation/paystack";

export async function resolveInitializePayment(input: z.infer<typeof initializePaymentSchema>) {
  if (!isPaystackConfigured()) {
    throw new Error(
      "Paystack is not configured. Add your test keys from dashboard.paystack.com to .env.local.",
    );
  }

  switch (input.purpose) {
    case "checkout":
      return initializeCheckoutPayment({
        orderNumber: input.orderNumber!,
        paymentMethod: input.paymentMethod ?? "card",
        saveCard: input.saveCard,
        savedPaymentMethodId: input.savedPaymentMethodId,
      });
    case "seller_signup":
      return initializeSellerSignupPayment(input.sellerId);
    case "seller_subscription":
      return initializeSellerSubscriptionPayment(input.sellerId);
    default:
      throw new Error("Unsupported payment purpose.");
  }
}

async function initializeSellerSignupPayment(sellerId: string | undefined) {
  if (!sellerId) throw new Error("Seller id is required.");
  const seller = await getOwnedSeller(sellerId);

  const reference = createPaystackReference("SEL", sellerId);
  const result = await initializePaystackTransaction({
    email: seller.contact_email,
    amountZar: SELLER_CARD_VERIFICATION_ZAR,
    reference,
    callbackUrl: paystackCallbackUrl(),
    channels: paystackChannels("card"),
    metadata: {
      purpose: "seller_signup" satisfies PaystackPaymentPurpose,
      sellerId,
      plan: seller.plan,
    },
  });

  return {
    mode: "redirect" as const,
    authorizationUrl: result.authorization_url,
    reference: result.reference,
    amount: SELLER_CARD_VERIFICATION_ZAR,
    currency: "ZAR",
  };
}

async function initializeSellerSubscriptionPayment(sellerId: string | undefined) {
  if (!sellerId) throw new Error("Seller id is required.");
  const seller = await getOwnedSeller(sellerId);
  const plan = seller.plan as SellerPlan;
  const planConfig = SELLER_PLAN_BY_ID[plan];
  if (!planConfig) throw new Error("Unknown seller plan.");

  const reference = createPaystackReference("SEL", sellerId);
  const result = await initializePaystackTransaction({
    email: seller.contact_email,
    amountZar: planConfig.priceMonthly,
    reference,
    callbackUrl: paystackCallbackUrl(),
    channels: paystackChannels("card"),
    metadata: {
      purpose: "seller_subscription" satisfies PaystackPaymentPurpose,
      sellerId,
      plan,
    },
  });

  return {
    mode: "redirect" as const,
    authorizationUrl: result.authorization_url,
    reference: result.reference,
    amount: planConfig.priceMonthly,
    currency: "ZAR",
  };
}

async function getOwnedSeller(sellerId: string) {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) throw new Error("Sign in required.");

  const supabase = createServiceClient();
  const { data: seller, error } = await supabase
    .from("sellers")
    .select("id, user_id, contact_email, plan")
    .eq("id", sellerId)
    .maybeSingle();

  if (error) throw error;
  if (!seller || seller.user_id !== user.id) {
    throw new Error("Seller account not found.");
  }

  return seller;
}
