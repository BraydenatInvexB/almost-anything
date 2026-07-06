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
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { isPaystackConfigured, paystackConfigIssue } from "@/config/paystack";
import { checkoutPaymentPageUrl } from "@/lib/payments/payment-urls";

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

  const usePaystack =
    isPaystackConfigured() &&
    (parsed.data.paymentMethod === "card" || parsed.data.paymentMethod === "eft");

  try {
    if (parsed.data.paymentMethod === "demo") {
      if (process.env.NODE_ENV !== "development") {
        return secureErrorResponse("Demo checkout is disabled.", "DEMO_DISABLED", 400);
      }

      const order = await createOrder(parsed.data, userId);
      await persistSavedAddress(userId, parsed.data.saveAddress, parsed.data.shippingAddress);

      await logApiRequest("/api/checkout", "POST", ip, 200);
      return secureJsonResponse({
        orderNumber: order.orderNumber,
        order,
        mode: "demo",
        redirectUrl: `/checkout/success?orderNumber=${encodeURIComponent(order.orderNumber)}`,
      });
    }

    if (!usePaystack) {
      const issue = paystackConfigIssue();
      return secureErrorResponse(
        issue ??
          "Online payments are temporarily unavailable. Use demo checkout in development or add Paystack keys.",
        "PAYMENTS_UNAVAILABLE",
        503,
      );
    }

    const order = await createOrder(parsed.data, userId);
    await persistSavedAddress(userId, parsed.data.saveAddress, parsed.data.shippingAddress);

    await logApiRequest("/api/checkout", "POST", ip, 200);
    return secureJsonResponse({
      orderNumber: order.orderNumber,
      total: order.total,
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      mode: "paystack",
      redirectUrl: checkoutPaymentPageUrl(order.orderNumber),
      paymentMethod: parsed.data.paymentMethod,
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
