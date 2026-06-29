import { NextRequest } from "next/server";
import { z } from "zod";
import {
  rateLimit,
  secureJsonResponse,
  secureErrorResponse,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";
import { logSearchEvent } from "@/services/search-analytics-service";

const logSearchSchema = z.object({
  query: z.string().min(2).max(500),
  inputMethod: z.enum(["text", "voice", "image", "request", "admin"]).optional(),
  source: z.string().max(64).optional(),
  sessionId: z.string().max(128).optional(),
  resultCount: z.number().int().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request, 120);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return secureErrorResponse("Invalid JSON body", "INVALID_JSON");
  }

  const parsed = logSearchSchema.safeParse(body);
  if (!parsed.success) {
    return secureErrorResponse(
      parsed.error.issues[0]?.message ?? "Invalid request",
      "VALIDATION_ERROR",
    );
  }

  await logSearchEvent({
    query: parsed.data.query,
    inputMethod: parsed.data.inputMethod,
    source: parsed.data.source,
    sessionId: parsed.data.sessionId,
    resultCount: parsed.data.resultCount,
    metadata: parsed.data.metadata,
  });

  await logApiRequest("/api/search/log", "POST", ip, 204);
  return secureJsonResponse({ ok: true }, 204);
}
