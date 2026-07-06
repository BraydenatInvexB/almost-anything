import "server-only";
import { z } from "zod";
import {
  isPaystackConfigured,
  paystackChannels,
  SELLER_CARD_VERIFICATION_ZAR,
} from "@/config/paystack";
import { SELLER_PLAN_BY_ID } from "@/config/seller-plans";
import { createPaystackReference } from "@/lib/payments/paystack-reference";
import { initializePaystackTransaction } from "@/lib/payments/paystack-client";
import { paystackCallbackUrl } from "@/lib/payments/payment-urls";
import { markOrderPaystackReference } from "@/lib/payments/paystack-fulfillment";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PaystackPaymentPurpose } from "@/config/paystack";
import type { SellerPlan } from "@/types/seller";
import type { initializePaymentSchema } from "@/lib/validation/paystack";

export async function resolveInitializePayment(input: z.infer<typeof initializePaymentSchema>) {
  if (!isPaystackConfigured()) {
    throw new Error("Paystack is not configured.");
  }

  switch (input.purpose) {
    case "checkout":
      return initializeCheckoutPayment(input.orderNumber, input.paymentMethod ?? "card");
    case "seller_signup":
      return initializeSellerSignupPayment(input.sellerId);
    case "seller_subscription":
      return initializeSellerSubscriptionPayment(input.sellerId);
    default:
      throw new Error("Unsupported payment purpose.");
  }
}

async function initializeCheckoutPayment(orderNumber: string | undefined, paymentMethod: "card" | "eft") {
  if (!orderNumber) throw new Error("Order number is required.");
  if (!isSupabaseConfigured()) throw new Error("Database is not configured.");

  const supabase = createServiceClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("order_number, total, status, payment_method, shipping_address")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error) throw error;
  if (!order) throw new Error("Order not found.");
  if (order.status === "paid") throw new Error("This order is already paid.");

  const address = order.shipping_address as { email?: string } | null;
  const email = address?.email;
  if (!email) throw new Error("Order email is missing.");

  const reference = createPaystackReference("CHK", orderNumber);
  const result = await initializePaystackTransaction({
    email,
    amountZar: Number(order.total),
    reference,
    callbackUrl: paystackCallbackUrl(),
    channels: paystackChannels(paymentMethod),
    metadata: {
      purpose: "checkout" satisfies PaystackPaymentPurpose,
      orderNumber,
      paymentMethod,
    },
  });

  await markOrderPaystackReference(orderNumber, reference);

  return {
    authorizationUrl: result.authorization_url,
    reference: result.reference,
    amount: Number(order.total),
    currency: "ZAR",
  };
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

  const reference = createPaystackReference("SUB", sellerId);
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
