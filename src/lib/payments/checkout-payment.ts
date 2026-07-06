import "server-only";
import { paystackChannels } from "@/config/paystack";
import { createPaystackReference } from "@/lib/payments/paystack-reference";
import {
  chargePaystackAuthorization,
  initializePaystackTransaction,
} from "@/lib/payments/paystack-client";
import { markOrderPaystackReference } from "@/lib/payments/paystack-fulfillment";
import { fulfillPaystackPayment } from "@/lib/payments/paystack-fulfillment";
import { paystackCallbackUrl } from "@/lib/payments/payment-urls";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  getCustomerPaymentMethodForUser,
  getCurrentUserId,
} from "@/services/customer-payment-methods";
import type { CheckoutPaymentMethod } from "@/config/paystack";

interface CheckoutOrderRow {
  order_number: string;
  total: number;
  status: string;
  user_id: string | null;
  shipping_address: { email?: string } | null;
}

export async function initializeCheckoutPayment(input: {
  orderNumber: string;
  paymentMethod: CheckoutPaymentMethod;
  saveCard?: boolean;
  savedPaymentMethodId?: string;
}) {
  if (!isSupabaseConfigured()) throw new Error("Database is not configured.");

  const supabase = createServiceClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("order_number, total, status, user_id, shipping_address")
    .eq("order_number", input.orderNumber)
    .maybeSingle();

  if (error) throw error;
  if (!order) throw new Error("Order not found.");

  const row = order as CheckoutOrderRow;
  if (row.status === "paid") throw new Error("This order is already paid.");

  const email = row.shipping_address?.email;
  if (!email) throw new Error("Order email is missing.");

  const userId = (await getCurrentUserId()) ?? row.user_id ?? undefined;
  const metadata = {
    purpose: "checkout" as const,
    orderNumber: input.orderNumber,
    paymentMethod: input.paymentMethod,
    saveCard: Boolean(input.saveCard && userId),
    userId,
  };

  if (input.savedPaymentMethodId && input.paymentMethod === "card") {
    if (!userId) throw new Error("Sign in to use a saved card.");
    const saved = await getCustomerPaymentMethodForUser(userId, input.savedPaymentMethodId);
    if (!saved) throw new Error("Saved card not found.");

    const reference = createPaystackReference("CHK", input.orderNumber);
    const charge = await chargePaystackAuthorization({
      authorizationCode: saved.authorization_code,
      email,
      amountZar: Number(row.total),
      reference,
      metadata,
    });

    if (charge.status !== "success") {
      throw new Error("Saved card payment failed. Try another card.");
    }

    const verification = { ...charge, metadata };
    await markOrderPaystackReference(input.orderNumber, reference);
    const result = await fulfillPaystackPayment(verification);
    return {
      mode: "charged" as const,
      redirectUrl: result.redirectUrl,
      reference,
      amount: Number(row.total),
      currency: "ZAR",
    };
  }

  const reference = createPaystackReference("CHK", input.orderNumber);
  const result = await initializePaystackTransaction({
    email,
    amountZar: Number(row.total),
    reference,
    callbackUrl: paystackCallbackUrl(),
    channels: paystackChannels(input.paymentMethod),
    metadata,
  });

  await markOrderPaystackReference(input.orderNumber, reference);

  return {
    mode: "redirect" as const,
    authorizationUrl: result.authorization_url,
    reference: result.reference,
    amount: Number(row.total),
    currency: "ZAR",
  };
}
