import { NextRequest } from "next/server";
import {
  secureJsonResponse,
  secureErrorResponse,
  requireInternalAuth,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";
import { spawnPythonWorker } from "@/lib/sourcing/python-worker";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const authError = requireInternalAuth(request);
  if (authError) {
    await logApiRequest("/api/internal/sourcing/process", "POST", ip, 401);
    return authError;
  }

  const started = spawnPythonWorker(["--process-pending"]);
  await logApiRequest("/api/internal/sourcing/process", "POST", ip, started ? 202 : 503);

  if (!started) {
    return secureErrorResponse("Python worker unavailable", "SERVICE_UNAVAILABLE", 503);
  }

  return secureJsonResponse({ queued: true, mode: "process-pending" }, 202);
}
