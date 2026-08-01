import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { provisionInviteAuthUser } from "@/lib/auth/provision-invite";
import { resolveSiteOrigin } from "@/lib/site-url";

type ServiceClient = SupabaseClient<Database>;

/** Invite links land on accept-invite so the invitee can set a password. */
export function sellerInviteRedirectUrl(request?: Request): string {
  return `${resolveSiteOrigin(request)}/seller/accept-invite`;
}

/**
 * Create or locate an auth user and always email a password-setup link
 * for seller team invites (invite email, or recovery fallback).
 */
export async function provisionSellerTeamAuthUser(
  supabase: ServiceClient,
  email: string,
  fullName: string,
  options?: { resend?: boolean; request?: Request },
) {
  return provisionInviteAuthUser(supabase, email, fullName, {
    redirectTo: sellerInviteRedirectUrl(options?.request),
    // Always deliver a link so the teammate can set / update their password.
    resend: true,
    passwordSetupFallback: true,
  });
}
