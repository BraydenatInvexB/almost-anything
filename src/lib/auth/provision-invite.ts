import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type ServiceClient = SupabaseClient<Database>;

export type ProvisionInviteResult =
  | { userId: string; emailSent: boolean; redirectTo: string }
  | { error: string };

async function findAuthUserByEmail(supabase: ServiceClient, email: string) {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return null;
  return data.users.find((u) => u.email?.trim().toLowerCase() === normalized) ?? null;
}

function isAlreadyRegisteredError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("already") || lower.includes("registered") || lower.includes("exists");
}

/**
 * Send a recovery/password-setup email that lands on the same accept-invite URL.
 * Used when the auth user already exists and inviteUserByEmail cannot resend.
 */
async function sendPasswordSetupEmail(
  supabase: ServiceClient,
  email: string,
  redirectTo: string,
): Promise<{ ok: true } | { error: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: error.message };
  return { ok: true };
}

/**
 * Create or locate an auth user and send an email that lets them set a password.
 * Relies on Supabase Auth email/SMTP configuration for delivery.
 */
export async function provisionInviteAuthUser(
  supabase: ServiceClient,
  email: string,
  fullName: string,
  options: {
    redirectTo: string;
    /** Force sending an invite/recovery email even if the auth user already exists. */
    resend?: boolean;
    /**
     * When invite email cannot be sent (user already registered), fall back to a
     * password-reset email that still lands on the accept-invite page.
     */
    passwordSetupFallback?: boolean;
  },
): Promise<ProvisionInviteResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findAuthUserByEmail(supabase, normalizedEmail);
  const redirectTo = options.redirectTo;

  if (existing && !options.resend && !options.passwordSetupFallback) {
    return { userId: existing.id, emailSent: false, redirectTo };
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
    data: { full_name: fullName },
    redirectTo,
  });

  if (!error) {
    const userId = data.user?.id ?? existing?.id;
    if (!userId) {
      return { error: "Invitation was not created" };
    }
    return { userId, emailSent: true, redirectTo };
  }

  if (isAlreadyRegisteredError(error.message) && existing) {
    if (options.passwordSetupFallback || options.resend) {
      const recovery = await sendPasswordSetupEmail(supabase, normalizedEmail, redirectTo);
      if ("error" in recovery) {
        return { error: recovery.error };
      }
      return { userId: existing.id, emailSent: true, redirectTo };
    }
    return { userId: existing.id, emailSent: false, redirectTo };
  }

  return { error: error.message };
}
