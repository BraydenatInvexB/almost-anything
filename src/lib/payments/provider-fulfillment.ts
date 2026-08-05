import "server-only";

import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { ensureProcurementForSupabaseOrder } from "@/lib/admin/operations-persistence";
import { activateSellerSubscriptionOnFirstSale } from "@/services/seller/subscription";
import type { Json } from "@/types/database";
import type { PaymentProvider } from "@/config/payment-providers";

interface HostedOrderRow {
  id: string;
  status: string;
  total: number;
  metadata: unknown;
  order_items: { product_id: string | null }[] | null;
}

function db() {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Database is not configured.");
  }
  return createServiceClient();
}

export async function fulfillHostedPayment(input: {
  provider: PaymentProvider;
  reference: string;
  amount?: number;
  transactionId?: string;
  paidAt?: string;
}) {
  if (input.reference.startsWith("CHK-")) return fulfillOrder(input);
  if (input.reference.startsWith("SUB-")) return fulfillSubscription(input);
  throw new Error("Unsupported payment reference.");
}

async function fulfillOrder(input: {
  provider: PaymentProvider;
  reference: string;
  amount?: number;
  transactionId?: string;
  paidAt?: string;
}) {
  const orderNumber = input.reference.slice(4);
  const supabase = db();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id,status,total,metadata,order_items(product_id)")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) throw error;
  const orderRow = order as unknown as HostedOrderRow | null;
  if (!orderRow) throw new Error("Order not found.");
  if (input.amount !== undefined && Math.abs(Number(orderRow.total) - input.amount) > 0.01) {
    throw new Error("Payment amount does not match the order total.");
  }

  if (orderRow.status !== "paid" && orderRow.status !== "sourcing") {
    const metadata = (orderRow.metadata as Record<string, unknown> | null) ?? {};
    const { error: updateError } = await supabase.from("orders").update({
      status: "paid",
      payment_intent_id: input.reference,
      payment_method: input.provider,
      metadata: {
        ...metadata,
        paymentProvider: input.provider,
        paymentReference: input.reference,
        providerTransactionId: input.transactionId ?? null,
        paidAt: input.paidAt ?? new Date().toISOString(),
      } as Json,
    }).eq("id", orderRow.id);
    if (updateError) throw updateError;

    await supabase.from("orders").update({ status: "sourcing" }).eq("id", orderRow.id);
    await ensureProcurementForSupabaseOrder(orderRow.id);
    const productIds = (orderRow.order_items ?? [])
      .map((item) => item.product_id)
      .filter((id): id is string => Boolean(id));
    await activateSellerSubscriptionOnFirstSale(productIds);
  }
  return { redirectUrl: `/checkout/success?orderNumber=${encodeURIComponent(orderNumber)}` };
}

async function fulfillSubscription(input: {
  provider: PaymentProvider;
  reference: string;
  transactionId?: string;
  paidAt?: string;
}) {
  const sellerId = input.reference.slice(4);
  const supabase = db();
  const { data: seller, error } = await supabase.from("sellers").select("metadata").eq("id", sellerId).maybeSingle();
  if (error) throw error;
  if (!seller) throw new Error("Seller not found.");
  const now = input.paidAt ?? new Date().toISOString();
  const metadata = (seller.metadata as Record<string, unknown> | null) ?? {};
  const { error: updateError } = await supabase.from("sellers").update({
    subscription_status: "active",
    subscription_starts_at: now,
    metadata: {
      ...metadata,
      lastSubscriptionPaymentAt: now,
      lastSubscriptionReference: input.reference,
      lastSubscriptionProvider: input.provider,
      lastSubscriptionTransactionId: input.transactionId ?? null,
    } as Json,
  }).eq("id", sellerId);
  if (updateError) throw updateError;
  return { redirectUrl: "/seller/subscription?payment=success" };
}

export async function hostedPaymentStatus(reference: string) {
  const supabase = db();
  if (reference.startsWith("CHK-")) {
    const orderNumber = reference.slice(4);
    const { data } = await supabase.from("orders").select("status").eq("order_number", orderNumber).maybeSingle();
    const paid = data?.status === "paid" || data?.status === "sourcing";
    return { paid, redirectUrl: paid ? `/checkout/success?orderNumber=${encodeURIComponent(orderNumber)}` : null };
  }
  if (reference.startsWith("SUB-")) {
    const { data } = await supabase.from("sellers").select("subscription_status").eq("id", reference.slice(4)).maybeSingle();
    const paid = data?.subscription_status === "active";
    return { paid, redirectUrl: paid ? "/seller/subscription?payment=success" : null };
  }
  return { paid: false, redirectUrl: null };
}
