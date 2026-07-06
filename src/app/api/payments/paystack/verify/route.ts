import { NextRequest } from "next/server";
import {
  getClientIp,
  logApiRequest,
  rateLimit,
  secureErrorResponse,
  secureJsonResponse,
} from "@/lib/security/api";
import { verifyPaystackTransaction } from "@/lib/payments/paystack-client";
import { fulfillPaystackPayment } from "@/lib/payments/paystack-fulfillment";
import { verifyPaymentSchema } from "@/lib/validation/paystack";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request, 30);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return secureErrorResponse("Invalid JSON body", "INVALID_JSON");
  }

  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    await logApiRequest("/api/payments/paystack/verify", "POST", ip, 400);
    return secureErrorResponse("Payment reference is required.", "VALIDATION_ERROR");
  }

  try {
    const verification = await verifyPaystackTransaction(parsed.data.reference);
    if (verification.status !== "success") {
      await logApiRequest("/api/payments/paystack/verify", "POST", ip, 402);
      return secureJsonResponse(
        {
          ok: false,
          status: verification.status,
          redirectUrl: `/payment/failed?reference=${encodeURIComponent(parsed.data.reference)}`,
        },
        402,
      );
    }

    const result = await fulfillPaystackPayment(verification);
    await logApiRequest("/api/payments/paystack/verify", "POST", ip, 200);
    return secureJsonResponse({ ok: true, ...result });
  } catch (error) {
    await logApiRequest("/api/payments/paystack/verify", "POST", ip, 500);
    return secureErrorResponse(
      error instanceof Error ? error.message : "Payment verification failed",
      "PAYSTACK_VERIFY_ERROR",
      500,
    );
  }
}
