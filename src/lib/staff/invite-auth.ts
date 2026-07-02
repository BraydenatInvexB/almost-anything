import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type ServiceClient = SupabaseClient<Database>;

function siteBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

/** Invite links must pass through auth callback so the session is established before password setup. */
export function staffInviteRedirectUrl(): string {
  const next = encodeURIComponent("/admin/accept-invite");
  return `${siteBaseUrl()}/auth/callback?next=${next}`;
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
  options?: { resend?: boolean },
): Promise<{ userId: string; emailSent: boolean } | { error: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findAuthUserByEmail(supabase, normalizedEmail);
  const redirectTo = staffInviteRedirectUrl();

  if (existing && !options?.resend) {
    return { userId: existing.id, emailSent: false };
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
      return { userId: existing.id, emailSent: false };
    }
    return { error: error.message };
  }

  const userId = data.user?.id ?? existing?.id;
  if (!userId) {
    return { error: "Invitation was not created" };
  }

  return { userId, emailSent: true };
}
