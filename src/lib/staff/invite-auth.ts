import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { provisionInviteAuthUser } from "@/lib/auth/provision-invite";
import { resolveSiteOrigin } from "@/lib/site-url";

type ServiceClient = SupabaseClient<Database>;

/** Invite links land on accept-invite so the browser can finish PKCE / hash token exchange. */
export function staffInviteRedirectUrl(request?: Request): string {
  return `${resolveSiteOrigin(request)}/admin/accept-invite`;
}

/** Create or locate an auth user and send a Supabase invite email when needed. */
export async function provisionStaffAuthUser(
  supabase: ServiceClient,
  email: string,
  fullName: string,
  options?: { resend?: boolean; request?: Request },
) {
  return provisionInviteAuthUser(supabase, email, fullName, {
    redirectTo: staffInviteRedirectUrl(options?.request),
    resend: options?.resend,
  });
}
