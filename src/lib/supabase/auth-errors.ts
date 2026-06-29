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
    return "We've sent too many confirmation emails recently. Wait about an hour and try again, or sign in if you already confirmed your account.";
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
