import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveSiteOrigin } from "@/lib/site-url";

type ServiceClient = SupabaseClient<Database>;

/** Invite links must pass through auth callback so the session is established before password setup. */
export function staffInviteRedirectUrl(request?: Request): string {
  const base = resolveSiteOrigin(request);
  const next = encodeURIComponent("/admin/accept-invite");
  return `${base}/auth/callback?next=${next}`;
}

async function findAuthUserByEmail(supabase: ServiceClient, email: string) {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return null;
  return data.users.find((u) => u.email?.trim().toLowerCase() === normalized) ?? null;
}

/** Create or locate an auth user and send a Supabase invite email when needed. */
export async function provisionStaffAuthUser(
  supabase: ServiceClient,
  email: string,
  fullName: string,
  options?: { resend?: boolean; request?: Request },
): Promise<{ userId: string; emailSent: boolean; redirectTo: string } | { error: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findAuthUserByEmail(supabase, normalizedEmail);
  const redirectTo = staffInviteRedirectUrl(options?.request);

  if (existing && !options?.resend) {
    return { userId: existing.id, emailSent: false, redirectTo };
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
    data: { full_name: fullName },
    redirectTo,
  });

  if (error) {
    const alreadyRegistered =
      error.message.toLowerCase().includes("already") ||
      error.message.toLowerCase().includes("registered");
    if (alreadyRegistered && existing) {
      return { userId: existing.id, emailSent: false, redirectTo };
    }
    return { error: error.message };
  }

  const userId = data.user?.id ?? existing?.id;
  if (!userId) {
    return { error: "Invitation was not created" };
  }

  return { userId, emailSent: true, redirectTo };
}
