import { NextRequest } from "next/server";
import {
  rateLimit,
  secureJsonResponse,
  secureErrorResponse,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";
import { sourcingRequestSchema } from "@/lib/validation/checkout";
import { generateRequestId } from "@/lib/utils/cn";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request, 10);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return secureErrorResponse("Invalid JSON body", "INVALID_JSON");
  }

  const parsed = sourcingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return secureErrorResponse(
      parsed.error.issues[0]?.message ?? "Invalid request",
      "VALIDATION_ERROR",
    );
  }

  const requestId = generateRequestId();
  const parsedIntent = {
    query: parsed.data.query,
    keywords: parsed.data.query
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 12),
    budget: parsed.data.budget ?? null,
    urgency: parsed.data.urgency ?? "standard",
  };

  try {
    if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createServiceClient();
      await supabase.from("customer_requests").insert({
        id: requestId,
        query: parsed.data.query,
        parsed_intent: parsedIntent,
        status: "searching",
      });
    }

    await logApiRequest("/api/sourcing", "POST", ip, 200);
    return secureJsonResponse({
      requestId,
      status: "searching",
      message:
        "Your request has been submitted. We'll confirm availability and pricing shortly.",
    });
  } catch {
    await logApiRequest("/api/sourcing", "POST", ip, 500);
    return secureErrorResponse("Sourcing request failed", "INTERNAL_ERROR", 500);
  }
}
