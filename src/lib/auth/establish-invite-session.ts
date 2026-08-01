import type { SupabaseClient } from "@supabase/supabase-js";

type AuthUser = NonNullable<Awaited<ReturnType<SupabaseClient["auth"]["getUser"]>>["data"]["user"]>;

type EstablishResult =
  | { user: AuthUser }
  | { user: null }
  | { error: string };

function readHashParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

/**
 * Finish invite / recovery / magic-link token exchange in the browser,
 * then return the authenticated user who can set a password.
 */
export async function establishInviteSession(
  supabase: SupabaseClient,
  options: {
    code: string | null;
    tokenHash: string | null;
    type: string | null;
    callbackError: string | null;
    cleanPath: string;
    expiredMessage: string;
  },
): Promise<EstablishResult> {
  if (options.callbackError) {
    return { error: options.expiredMessage };
  }

  const hashParams = readHashParams();
  const hashType = hashParams.get("type");
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  const otpTypes = new Set(["invite", "recovery", "magiclink", "email"]);

  if (options.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(options.code);
    if (error) return { error: error.message };
    window.history.replaceState(null, "", options.cleanPath);
  } else if (options.tokenHash && options.type && otpTypes.has(options.type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: options.tokenHash,
      type: options.type as "invite" | "recovery" | "magiclink" | "email",
    });
    if (error) return { error: error.message };
    window.history.replaceState(null, "", options.cleanPath);
  } else if (accessToken && refreshToken && (!hashType || otpTypes.has(hashType))) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) return { error: error.message };
    window.history.replaceState(null, "", options.cleanPath);
  }

  const hadInviteToken = Boolean(
    options.code ||
      options.tokenHash ||
      accessToken ||
      refreshToken,
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) return { error: userError.message };
  if (!user) {
    return hadInviteToken ? { error: options.expiredMessage } : { user: null };
  }

  return { user };
}
