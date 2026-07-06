import { NextRequest } from "next/server";
import {
  getClientIp,
  logApiRequest,
  rateLimit,
  secureErrorResponse,
  secureJsonResponse,
} from "@/lib/security/api";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  deleteCustomerPaymentMethod,
  listCustomerPaymentMethods,
} from "@/services/customer-payment-methods";

async function requireUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request, 30);
  if (limited) return limited;

  const user = await requireUser();
  if (!user) {
    return secureErrorResponse("Sign in to view saved cards", "UNAUTHORIZED", 401);
  }

  try {
    const methods = await listCustomerPaymentMethods(user.id);
    await logApiRequest("/api/account/payment-methods", "GET", ip, 200);
    return secureJsonResponse({ methods });
  } catch (error) {
    await logApiRequest("/api/account/payment-methods", "GET", ip, 500);
    return secureErrorResponse(
      error instanceof Error ? error.message : "Could not load saved cards",
      "PAYMENT_METHODS_ERROR",
      500,
    );
  }
}

export async function DELETE(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request, 20);
  if (limited) return limited;

  const user = await requireUser();
  if (!user) {
    return secureErrorResponse("Sign in required", "UNAUTHORIZED", 401);
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return secureErrorResponse("Card id is required", "VALIDATION_ERROR", 400);
  }

  try {
    await deleteCustomerPaymentMethod(user.id, id);
    await logApiRequest("/api/account/payment-methods", "DELETE", ip, 200);
    return secureJsonResponse({ ok: true });
  } catch (error) {
    await logApiRequest("/api/account/payment-methods", "DELETE", ip, 500);
    return secureErrorResponse(
      error instanceof Error ? error.message : "Could not remove card",
      "PAYMENT_METHODS_ERROR",
      500,
    );
  }
}
