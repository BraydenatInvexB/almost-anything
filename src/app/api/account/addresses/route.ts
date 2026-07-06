import { NextRequest } from "next/server";
import { z } from "zod";
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
  deleteCustomerAddress,
  listCustomerAddressesForSession,
  setDefaultCustomerAddress,
} from "@/services/customer-address-service";

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
    return secureErrorResponse("Sign in to view saved addresses", "UNAUTHORIZED", 401);
  }

  try {
    const addresses = await listCustomerAddressesForSession();
    await logApiRequest("/api/account/addresses", "GET", ip, 200);
    return secureJsonResponse({ addresses });
  } catch {
    await logApiRequest("/api/account/addresses", "GET", ip, 500);
    return secureErrorResponse("Failed to load addresses", "INTERNAL_ERROR", 500);
  }
}

const patchSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["set_default"]),
});

export async function PATCH(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request, 20);
  if (limited) return limited;

  const user = await requireUser();
  if (!user) {
    return secureErrorResponse("Sign in required", "UNAUTHORIZED", 401);
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return secureErrorResponse("Invalid payload", "VALIDATION_ERROR", 400);
  }

  try {
    if (parsed.data.action === "set_default") {
      await setDefaultCustomerAddress(user.id, parsed.data.id);
    }
    const addresses = await listCustomerAddressesForSession();
    await logApiRequest("/api/account/addresses", "PATCH", ip, 200);
    return secureJsonResponse({ ok: true, addresses });
  } catch {
    await logApiRequest("/api/account/addresses", "PATCH", ip, 500);
    return secureErrorResponse("Failed to update address", "INTERNAL_ERROR", 500);
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
    return secureErrorResponse("Missing address id", "VALIDATION_ERROR", 400);
  }

  try {
    await deleteCustomerAddress(user.id, id);
    const addresses = await listCustomerAddressesForSession();
    await logApiRequest("/api/account/addresses", "DELETE", ip, 200);
    return secureJsonResponse({ ok: true, addresses });
  } catch {
    await logApiRequest("/api/account/addresses", "DELETE", ip, 500);
    return secureErrorResponse("Failed to delete address", "INTERNAL_ERROR", 500);
  }
}
