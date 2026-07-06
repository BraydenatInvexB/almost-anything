/** Safe in-app redirect for console sign-in pages. */
export function sanitizeConsoleRedirect(
  value: string | null | undefined,
  allowedPrefix: string,
  fallback: string,
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (!value.startsWith(allowedPrefix)) return fallback;
  return value;
}
