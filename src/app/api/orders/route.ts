import { NextRequest } from "next/server";
import {
  rateLimit,
  secureJsonResponse,
  secureErrorResponse,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";
import { createClient } from "@/lib/supabase/server";
import { getOrdersForUser, getOrderByNumber } from "@/services/order-service";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request);
  if (limited) return limited;

  const orderNumber = request.nextUrl.searchParams.get("orderNumber");

  if (orderNumber) {
    const order = await getOrderByNumber(orderNumber);
    if (!order) {
      return secureErrorResponse("Order not found", "NOT_FOUND", 404);
    }
    await logApiRequest("/api/orders", "GET", ip, 200);
    return secureJsonResponse({ order });
  }

  if (!isSupabaseConfigured()) {
    return secureJsonResponse({ orders: [] });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return secureErrorResponse("Sign in to view orders", "UNAUTHORIZED", 401);
    }

    const orders = await getOrdersForUser(user.id);
    await logApiRequest("/api/orders", "GET", ip, 200);
    return secureJsonResponse({ orders });
  } catch {
    await logApiRequest("/api/orders", "GET", ip, 500);
    return secureErrorResponse("Failed to fetch orders", "INTERNAL_ERROR", 500);
  }
}
