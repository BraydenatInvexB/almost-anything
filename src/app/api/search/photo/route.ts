import { NextRequest } from "next/server";
import { z } from "zod";
import {
  rateLimit,
  secureJsonResponse,
  secureErrorResponse,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";
import { describeSearchPhoto } from "@/lib/search/photo/describe";
import { llmConfigured } from "@/lib/sourcing/llm-client";

const bodySchema = z.object({
  dataUrl: z
    .string()
    .min(32)
    .max(2_000_000)
    .refine((v) => v.startsWith("data:image/"), "Expected an image data URL"),
  hint: z.string().max(200).optional(),
});

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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return secureErrorResponse(
      parsed.error.issues[0]?.message ?? "Invalid request",
      "VALIDATION_ERROR",
    );
  }

  if (!llmConfigured()) {
    await logApiRequest("/api/search/photo", "POST", ip, 200);
    return secureJsonResponse({ query: parsed.data.hint?.trim() || null, label: null });
  }

  const result = await describeSearchPhoto(parsed.data.dataUrl);
  const query = result?.query || parsed.data.hint?.trim() || null;

  await logApiRequest("/api/search/photo", "POST", ip, 200);
  return secureJsonResponse({
    query,
    label: result?.label ?? null,
  });
}
