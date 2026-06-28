import { NextRequest } from "next/server";
import {
  rateLimit,
  secureJsonResponse,
  secureErrorResponse,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  getAuthenticatedCustomerReturns,
  getCustomerReturns,
  submitReturnRequest,
} from "@/services/return-service";
import type { ReturnMethod, ReturnReasonCode } from "@/lib/admin/operations-types";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request);
  if (limited) return limited;

  const email = request.nextUrl.searchParams.get("email");

  if (email) {
    const returns = await getCustomerReturns(undefined, email);
    await logApiRequest("/api/returns", "GET", ip, 200);
    return secureJsonResponse({ returns });
  }

  if (!isSupabaseConfigured()) {
    return secureJsonResponse({ returns: [] });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return secureErrorResponse("Sign in to view returns", "UNAUTHORIZED", 401);
    }

    const returns = await getAuthenticatedCustomerReturns();
    await logApiRequest("/api/returns", "GET", ip, 200);
    return secureJsonResponse({ returns });
  } catch {
    await logApiRequest("/api/returns", "GET", ip, 500);
    return secureErrorResponse("Failed to fetch returns", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request, 20);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  if (!body?.orderNumber || !body?.customerEmail || !body?.reason || !body?.reasonCode) {
    return secureErrorResponse("Missing required fields", "VALIDATION_ERROR", 400);
  }

  let userId: string | undefined;
  let customerName: string | undefined;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        customerName = (user.user_metadata?.full_name as string) ?? undefined;
        if (user.email && user.email.toLowerCase() !== body.customerEmail.trim().toLowerCase()) {
          return secureErrorResponse(
            "Email must match your account email",
            "VALIDATION_ERROR",
            400,
          );
        }
      }
    } catch {
      /* guest checkout flow */
    }
  }

  const result = await submitReturnRequest({
    orderNumber: body.orderNumber,
    customerEmail: body.customerEmail,
    customerName: customerName ?? body.customerName,
    reasonCode: body.reasonCode as ReturnReasonCode,
    reason: body.reason,
    method: (body.method ?? "courier_pickup") as ReturnMethod,
    itemIds: body.itemIds,
    userId,
  });

  if ("error" in result) {
    await logApiRequest("/api/returns", "POST", ip, 400);
    return secureErrorResponse(result.error, "VALIDATION_ERROR", 400);
  }

  await logApiRequest("/api/returns", "POST", ip, 201);
  return secureJsonResponse({ return: result.return }, 201);
}
