import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { CustomerPaymentMethod } from "@/types/customer-payment-method";
import type { PaystackVerifyResult } from "@/lib/payments/paystack-types";

interface PaymentMethodRow {
  id: string;
  user_id: string;
  provider: string;
  authorization_code: string;
  customer_code: string | null;
  card_type: string | null;
  last4: string;
  exp_month: string | null;
  exp_year: string | null;
  is_default: boolean;
  created_at: string;
}

function mapRow(row: PaymentMethodRow): CustomerPaymentMethod {
  return {
    id: row.id,
    provider: row.provider,
    cardType: row.card_type,
    last4: row.last4,
    expMonth: row.exp_month,
    expYear: row.exp_year,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

export async function listCustomerPaymentMethods(userId: string): Promise<CustomerPaymentMethod[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("customer_payment_methods")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as PaymentMethodRow[]).map(mapRow);
}

export async function getCustomerPaymentMethodForUser(userId: string, id: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("customer_payment_methods")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as PaymentMethodRow | null;
}

export async function deleteCustomerPaymentMethod(userId: string, id: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("customer_payment_methods")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) throw error;
}

export async function savePaymentMethodFromVerification(
  userId: string,
  verification: PaystackVerifyResult,
): Promise<void> {
  const auth = verification.authorization;
  if (!auth?.authorization_code || !auth.last4) return;

  const supabase = createServiceClient();
  const { count } = await supabase
    .from("customer_payment_methods")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const isFirst = (count ?? 0) === 0;

  const { error } = await supabase.from("customer_payment_methods").upsert(
    {
      user_id: userId,
      provider: "paystack",
      authorization_code: auth.authorization_code,
      customer_code: auth.customer_code ?? null,
      card_type: auth.card_type ?? null,
      last4: auth.last4,
      exp_month: auth.exp_month ?? null,
      exp_year: auth.exp_year ?? null,
      is_default: isFirst,
    },
    { onConflict: "user_id,authorization_code" },
  );

  if (error) throw error;
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}
