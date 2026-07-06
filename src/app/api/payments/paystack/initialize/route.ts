import { NextRequest } from "next/server";
import {
  getClientIp,
  logApiRequest,
  rateLimit,
  secureErrorResponse,
  secureJsonResponse,
} from "@/lib/security/api";
import { resolveInitializePayment } from "@/lib/payments/paystack-initialize-service";
import { initializePaymentSchema } from "@/lib/validation/paystack";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request, 20);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return secureErrorResponse("Invalid JSON body", "INVALID_JSON");
  }

  const parsed = initializePaymentSchema.safeParse(body);
  if (!parsed.success) {
    await logApiRequest("/api/payments/paystack/initialize", "POST", ip, 400);
    return secureErrorResponse(
      parsed.error.issues[0]?.message ?? "Invalid payment request",
      "VALIDATION_ERROR",
    );
  }

  try {
    const result = await resolveInitializePayment(parsed.data);
    await logApiRequest("/api/payments/paystack/initialize", "POST", ip, 200);
    return secureJsonResponse(result);
  } catch (error) {
    await logApiRequest("/api/payments/paystack/initialize", "POST", ip, 400);
    return secureErrorResponse(
      error instanceof Error ? error.message : "Unable to initialize payment",
      "PAYSTACK_INIT_ERROR",
      400,
    );
  }
}
