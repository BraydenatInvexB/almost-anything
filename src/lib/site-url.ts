/** Resolve the public site origin for emails, redirects, and webhooks. */

export function siteBaseUrlFromEnv(): string {
  return (
    process.env.SITE_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

/** Prefer the live request origin (production domain) over env defaults. */
export function resolveRequestOrigin(request: Request): string | undefined {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    const proto = forwardedProto?.split(",")[0]?.trim() ?? "https";
    if (host) return `${proto}://${host}`;
  }

  try {
    const { origin, hostname } = new URL(request.url);
    if (hostname === "localhost" || hostname === "127.0.0.1") return undefined;
    return origin;
  } catch {
    return undefined;
  }
}

export function resolveSiteOrigin(request?: Request): string {
  if (request) {
    const fromRequest = resolveRequestOrigin(request);
    if (fromRequest) return fromRequest;
  }
  return siteBaseUrlFromEnv();
}
