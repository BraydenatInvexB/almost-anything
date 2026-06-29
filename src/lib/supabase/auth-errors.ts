import type { AuthError } from "@supabase/supabase-js";

/** Turn Supabase auth errors into user-readable strings (avoids raw "{}" messages). */
export function formatAuthError(error: AuthError | null | undefined): string | undefined {
  if (!error) return undefined;

  const message = error.message?.trim();
  if (message && message !== "{}" && message !== "[object Object]") {
    return message;
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

  const code = "code" in error ? String(error.code) : "";
  if (code === "user_already_exists") {
    return "An account with this email already exists. Try signing in instead.";
  }

  return "Something went wrong. Please try again.";
}
