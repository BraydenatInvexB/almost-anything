import { NextRequest } from "next/server";
import { z } from "zod";
import {
  rateLimit,
  secureJsonResponse,
  secureErrorResponse,
  requireInternalAuth,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";
import { discoverAndIngestProducts } from "@/lib/sourcing/discovery-engine";

const discoverSchema = z.object({
  query: z.string().min(2).max(500),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const authError = requireInternalAuth(request);
  if (authError) {
    await logApiRequest("/api/internal/sourcing/discover", "POST", ip, 401);
    return authError;
  }

  const limited = rateLimit(request, 40);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return secureErrorResponse("Invalid JSON body", "INVALID_JSON");
  }

  const parsed = discoverSchema.safeParse(body);
  if (!parsed.success) {
    return secureErrorResponse("Invalid payload", "VALIDATION_ERROR");
  }

  try {
    const result = await discoverAndIngestProducts(parsed.data.query);
    await logApiRequest("/api/internal/sourcing/discover", "POST", ip, 200);
    return secureJsonResponse(result);
  } catch {
    await logApiRequest("/api/internal/sourcing/discover", "POST", ip, 500);
    return secureErrorResponse("Discovery failed", "INTERNAL_ERROR", 500);
  }
}
