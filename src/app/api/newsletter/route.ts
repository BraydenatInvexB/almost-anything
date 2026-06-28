import { NextRequest } from "next/server";
import {
  rateLimit,
  secureJsonResponse,
  secureErrorResponse,
  newsletterSchema,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/admin";
import { addEmailSubscriber } from "@/lib/admin/operations-store";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request, 10);
  if (limited) {
    await logApiRequest("/api/newsletter", "POST", ip, 429);
    return limited;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return secureErrorResponse("Invalid JSON body", "INVALID_JSON");
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    await logApiRequest("/api/newsletter", "POST", ip, 400);
    return secureErrorResponse(
      parsed.error.issues[0]?.message ?? "Invalid email",
      "VALIDATION_ERROR",
    );
  }

  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceClient();
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: parsed.data.email.toLowerCase(),
      });

      if (error?.code === "23505") {
        await logApiRequest("/api/newsletter", "POST", ip, 200);
        return secureJsonResponse({ success: true, message: "Already subscribed" });
      }

      if (error) throw error;
    } catch {
      await logApiRequest("/api/newsletter", "POST", ip, 500);
      return secureErrorResponse("Failed to subscribe", "INTERNAL_ERROR", 500);
    }
  }

  addEmailSubscriber({
    email: parsed.data.email,
    source: "newsletter",
    status: "active",
  });

  await logApiRequest("/api/newsletter", "POST", ip, 200);
  return secureJsonResponse({ success: true, message: "Subscribed successfully" });
}
