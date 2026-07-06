import "server-only";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { SELLER_PLAN_BY_ID } from "@/config/seller-plans";
import { ensureProcurementForSupabaseOrder } from "@/lib/admin/operations-persistence";
import { activateSellerSubscriptionOnFirstSale } from "@/services/seller/subscription";
import type { PaystackPaymentMetadata, PaystackVerifyResult } from "@/lib/payments/paystack-types";
import type { Json } from "@/types/database";
import type { SellerPlan } from "@/types/seller";

interface CheckoutOrderRow {
  id: string;
  status: string;
  metadata: unknown;
  order_items: { product_id: string | null }[] | null;
}

function db() {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Database is not configured.");
  }
  return createServiceClient();
}

export async function fulfillPaystackPayment(
  verification: PaystackVerifyResult,
): Promise<{ redirectUrl: string }> {
  const metadata = verification.metadata;
  if (!metadata?.purpose) {
    throw new Error("Payment metadata is missing.");
  }

  switch (metadata.purpose) {
    case "checkout":
      return fulfillCheckoutPayment(verification, metadata);
    case "seller_signup":
      return fulfillSellerSignupPayment(verification, metadata);
    case "seller_subscription":
      return fulfillSellerSubscriptionPayment(verification, metadata);
    default:
      throw new Error("Unsupported payment purpose.");
  }
}

async function fulfillCheckoutPayment(
  verification: PaystackVerifyResult,
  metadata: PaystackPaymentMetadata,
): Promise<{ redirectUrl: string }> {
  const orderNumber = metadata.orderNumber;
  if (!orderNumber) throw new Error("Order number missing from payment metadata.");

  const supabase = db();
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, metadata, order_items(product_id)")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error) throw error;
  const order = data as CheckoutOrderRow | null;
  if (!order) throw new Error("Order not found.");

  if (order.status !== "paid") {
    const existingMeta = (order.metadata as Record<string, unknown> | null) ?? {};
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_intent_id: verification.reference,
        payment_method: metadata.paymentMethod ?? verification.channel ?? "paystack",
        metadata: {
          ...existingMeta,
          paystackReference: verification.reference,
          paystackChannel: verification.channel ?? null,
          paidAt: verification.paid_at ?? new Date().toISOString(),
        } as Json,
      })
      .eq("order_number", orderNumber);

    if (updateError) throw updateError;

    await supabase.from("orders").update({ status: "sourcing" }).eq("id", order.id);
    await ensureProcurementForSupabaseOrder(order.id);

    const productIds = (order.order_items ?? [])
      .map((item) => item.product_id)
      .filter((id): id is string => Boolean(id));
    await activateSellerSubscriptionOnFirstSale(productIds);
  }

  return {
    redirectUrl: `/checkout/success?orderNumber=${encodeURIComponent(orderNumber)}`,
  };
}

async function fulfillSellerSignupPayment(
  verification: PaystackVerifyResult,
  metadata: PaystackPaymentMetadata,
): Promise<{ redirectUrl: string }> {
  const sellerId = metadata.sellerId;
  if (!sellerId) throw new Error("Seller id missing from payment metadata.");

  const supabase = db();
  const { data: seller, error } = await supabase
    .from("sellers")
    .select("metadata")
    .eq("id", sellerId)
    .maybeSingle();

  if (error) throw error;
  if (!seller) throw new Error("Seller not found.");

  const existingMeta = (seller.metadata as Record<string, unknown> | null) ?? {};
  const auth = verification.authorization;

  const { error: updateError } = await supabase
    .from("sellers")
    .update({
      metadata: {
        ...existingMeta,
        paystackReference: verification.reference,
        paystackAuthorizationCode: auth?.authorization_code ?? null,
        paystackCustomerCode: auth?.customer_code ?? null,
        paymentMethodVerifiedAt: verification.paid_at ?? new Date().toISOString(),
        paymentMethodLast4: auth?.last4 ?? null,
      } as Json,
    })
    .eq("id", sellerId);

  if (updateError) throw updateError;

  return {
    redirectUrl: `/seller/settings?onboarding=1&payment=verified`,
  };
}

async function fulfillSellerSubscriptionPayment(
  verification: PaystackVerifyResult,
  metadata: PaystackPaymentMetadata,
): Promise<{ redirectUrl: string }> {
  const sellerId = metadata.sellerId;
  const plan = metadata.plan as SellerPlan | undefined;
  if (!sellerId || !plan) {
    throw new Error("Seller subscription metadata is incomplete.");
  }

  const planConfig = SELLER_PLAN_BY_ID[plan];
  if (!planConfig) throw new Error("Unknown seller plan.");

  const supabase = db();
  const now = new Date().toISOString();
  const { data: seller, error } = await supabase
    .from("sellers")
    .select("metadata")
    .eq("id", sellerId)
    .maybeSingle();

  if (error) throw error;
  if (!seller) throw new Error("Seller not found.");

  const existingMeta = (seller.metadata as Record<string, unknown> | null) ?? {};
  const auth = verification.authorization;

  const { error: updateError } = await supabase
    .from("sellers")
    .update({
      plan,
      subscription_status: "active",
      subscription_starts_at: now,
      metadata: {
        ...existingMeta,
        lastSubscriptionPaymentAt: verification.paid_at ?? now,
        lastSubscriptionReference: verification.reference,
        paystackAuthorizationCode: auth?.authorization_code ?? existingMeta.paystackAuthorizationCode ?? null,
        paystackCustomerCode: auth?.customer_code ?? existingMeta.paystackCustomerCode ?? null,
      } as Json,
    })
    .eq("id", sellerId);

  if (updateError) throw updateError;

  return {
    redirectUrl: `/seller/subscription?payment=success`,
  };
}

export async function markOrderPaystackReference(
  orderNumber: string,
  reference: string,
): Promise<void> {
  const supabase = db();
  const { error } = await supabase
    .from("orders")
    .update({ payment_intent_id: reference })
    .eq("order_number", orderNumber);

  if (error) throw error;
}
