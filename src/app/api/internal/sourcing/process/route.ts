import { NextRequest } from "next/server";
import {
  secureJsonResponse,
  requireInternalAuth,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const authError = requireInternalAuth(request);
  if (authError) {
    await logApiRequest("/api/internal/sourcing/process", "POST", ip, 401);
    return authError;
  }

  await logApiRequest("/api/internal/sourcing/process", "POST", ip, 410);
  return secureJsonResponse(
    { queued: false, disabled: true, message: "Automated sourcing workers are disabled." },
    410,
  );
}
