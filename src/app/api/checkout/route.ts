import { NextRequest } from "next/server";
import {
  rateLimit,
  secureJsonResponse,
  secureErrorResponse,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";
import type { ShippingAddress } from "@/types/cart";
import { checkoutSchema } from "@/lib/validation/checkout";
import { createOrder } from "@/services/order-service";
import { saveCustomerAddressFromCheckout } from "@/services/customer-address-service";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith("sk_test_xxx")) return null;
  return new Stripe(key);
}

async function persistSavedAddress(
  userId: string | null,
  saveAddress: boolean | undefined,
  shippingAddress: ShippingAddress,
) {
  if (!userId || saveAddress === false) return;
  try {
    await saveCustomerAddressFromCheckout(userId, shippingAddress);
  } catch {
    // Address save is best-effort and must not block checkout.
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request, 15);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return secureErrorResponse("Invalid JSON body", "INVALID_JSON");
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    await logApiRequest("/api/checkout", "POST", ip, 400);
    return secureErrorResponse(
      parsed.error.issues[0]?.message ?? "Invalid checkout data",
      "VALIDATION_ERROR",
    );
  }

  let userId: string | null = null;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // continue as guest
    }
  }

  const stripe = getStripe();
  const useStripe =
    stripe &&
    parsed.data.paymentMethod === "card" &&
    Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  try {
    if (useStripe && stripe) {
      const order = await createOrder(
        { ...parsed.data, paymentMethod: "card" },
        userId,
      );

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.total * 100),
        currency: "zar",
        metadata: {
          customer_email: parsed.data.shippingAddress.email,
          order_number: order.orderNumber,
        },
        automatic_payment_methods: { enabled: true },
      });

      if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createServiceClient();
        await supabase
          .from("orders")
          .update({
            payment_intent_id: paymentIntent.id,
            status: "pending",
          })
          .eq("order_number", order.orderNumber);
      }

      await persistSavedAddress(userId, parsed.data.saveAddress, parsed.data.shippingAddress);

      await logApiRequest("/api/checkout", "POST", ip, 200);
      return secureJsonResponse({
        orderNumber: order.orderNumber,
        clientSecret: paymentIntent.client_secret,
        total: order.total,
        subtotal: order.subtotal,
        shipping: order.shipping,
        tax: order.tax,
        mode: "stripe",
      });
    }

    const order = await createOrder(parsed.data, userId);
    await persistSavedAddress(userId, parsed.data.saveAddress, parsed.data.shippingAddress);

    await logApiRequest("/api/checkout", "POST", ip, 200);
    return secureJsonResponse({
      orderNumber: order.orderNumber,
      order,
      mode: "demo",
      message: "Order placed successfully. Our sourcing team will begin fulfillment.",
    });
  } catch (error) {
    await logApiRequest("/api/checkout", "POST", ip, 500);
    return secureErrorResponse(
      error instanceof Error ? error.message : "Checkout failed",
      "CHECKOUT_ERROR",
      500,
    );
  }
}
