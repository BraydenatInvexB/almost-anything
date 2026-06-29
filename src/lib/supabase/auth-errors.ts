import type { AuthError } from "@supabase/supabase-js";

/** Turn Supabase auth errors into user-readable strings (avoids raw "{}" messages). */
export function formatAuthError(error: AuthError | null | undefined): string | undefined {
  if (!error) return undefined;

  const message = error.message?.trim().toLowerCase() ?? "";
  const code = "code" in error ? String(error.code) : "";

  if (
    code === "over_email_send_rate_limit" ||
    message.includes("email rate limit")
  ) {
    return "Supabase's email limit for this project has been reached (about 2 emails per hour on the free plan). It applies to all signups, not just one address. Turn off Confirm email under Authentication → Providers → Email in your Supabase dashboard, or wait about an hour and try again.";
  }

  const rawMessage = error.message?.trim();
  if (rawMessage && rawMessage !== "{}" && rawMessage !== "[object Object]") {
    return rawMessage;
  }

  if (error.status === 500) {
    return "We couldn't create your account right now. Please try again in a moment.";
  }

  if (error.status === 422) {
    return "Please check your email and password and try again.";
  }

  if (error.status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (code === "user_already_exists") {
    return "An account with this email already exists. Try signing in instead.";
  }

  return "Something went wrong. Please try again.";
}
