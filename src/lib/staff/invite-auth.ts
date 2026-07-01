import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type ServiceClient = SupabaseClient<Database>;

function adminSiteUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return base ? `${base}/admin/login` : "http://localhost:3000/admin/login";
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
): Promise<{ userId: string; emailSent: boolean } | { error: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findAuthUserByEmail(supabase, normalizedEmail);

  if (existing) {
    return { userId: existing.id, emailSent: false };
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
    data: { full_name: fullName },
    redirectTo: adminSiteUrl(),
  });

  if (error) {
    const alreadyRegistered =
      error.message.toLowerCase().includes("already") ||
      error.message.toLowerCase().includes("registered");
    if (alreadyRegistered) {
      const user = await findAuthUserByEmail(supabase, normalizedEmail);
      if (user) return { userId: user.id, emailSent: false };
    }
    return { error: error.message };
  }

  if (!data.user?.id) {
    return { error: "Invitation was not created" };
  }

  return { userId: data.user.id, emailSent: true };
}
