import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function rateLimit(
  request: NextRequest,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
): NextResponse | null {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (entry.count >= maxRequests) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED" },
      { status: 429 },
    );
  }

  entry.count += 1;
  return null;
}

export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!expectedKey) return false;
  return apiKey === expectedKey;
}

export function requireInternalAuth(request: NextRequest): NextResponse | null {
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }
  return null;
}

export function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin":
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-api-key",
  };
}

export function handleOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export function secureJsonResponse<T>(
  data: T,
  status: number = 200,
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      ...corsHeaders(),
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}

export function secureErrorResponse(
  message: string,
  code: string,
  status: number = 400,
): NextResponse {
  return secureJsonResponse({ error: message, code }, status);
}

export const quoteRequestSchema = z.object({
  query: z
    .string()
    .min(3, "Query must be at least 3 characters")
    .max(500, "Query too long"),
  budget: z.number().positive().optional(),
  urgency: z.enum(["standard", "express", "flexible"]).optional(),
  category: z.string().max(50).optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().max(200).optional(),
  category: z.string().max(50).optional(),
  page: z.coerce.number().int().min(1).max(100).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const newsletterSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const productIdSchema = z.object({
  id: z.string().uuid(),
});

export async function logApiRequest(
  route: string,
  method: string,
  ip: string,
  statusCode: number,
  userId?: string | null,
): Promise<void> {
  try {
    const { createServiceClient, isSupabaseConfigured } = await import(
      "@/lib/supabase/admin"
    );

    if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return;
    }

    const supabase = createServiceClient();
    await supabase.from("api_audit_log").insert({
      route,
      method,
      ip_address: ip,
      user_id: userId ?? null,
      status_code: statusCode,
    });
  } catch {
    // Audit logging should never break API responses
  }
}
