import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { sellerDb } from "@/lib/seller/db";

export async function resetSellerPassword(input: {
  sellerId: string;
  email: string;
  staffId: string;
  staffName: string;
}): Promise<{ demo?: boolean }> {
  if (!isSupabaseConfigured()) {
    return { demo: true };
  }

  const { data: seller, error: sellerError } = await sellerDb()
    .from("sellers")
    .select("id, contact_email, user_id")
    .eq("id", input.sellerId)
    .maybeSingle();

  if (sellerError) throw sellerError;
  if (!seller) throw new Error("Seller not found.");

  const email = input.email.trim().toLowerCase();
  if (seller.contact_email.toLowerCase() !== email) {
    throw new Error("Email does not match the seller account.");
  }

  const supabase = createServiceClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password?redirect=/seller`,
  });

  if (error) throw error;

  await supabase.from("staff_activity_log").insert({
    staff_id: input.staffId,
    staff_name: input.staffName,
    action: "Sent seller password reset",
    entity_type: "seller",
    entity_id: input.sellerId,
    details: { email },
  });

  return {};
}
