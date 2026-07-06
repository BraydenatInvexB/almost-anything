import type { ShippingAddress } from "@/types/cart";
import {
  addressFingerprint,
  fromShippingAddress,
  mapAddressRow,
  type CustomerAddress,
} from "@/types/customer-address";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function db() {
  return createServiceClient().from("customer_addresses");
}

function toInsert(userId: string, input: ReturnType<typeof fromShippingAddress>, isDefault: boolean) {
  return {
    user_id: userId,
    label: input.label ?? null,
    full_name: input.fullName,
    phone: input.phone,
    address_line1: input.addressLine1,
    address_line2: input.addressLine2 ?? null,
    city: input.city,
    state: input.state,
    postal_code: input.postalCode,
    country: input.country,
    is_default: isDefault,
  };
}

async function clearDefault(userId: string, exceptId?: string) {
  let query = db().update({ is_default: false }).eq("user_id", userId).eq("is_default", true);
  if (exceptId) query = query.neq("id", exceptId);
  await query;
}

export async function listCustomerAddresses(userId: string): Promise<CustomerAddress[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await db()
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapAddressRow(row as Record<string, unknown>));
}

export async function listCustomerAddressesForSession(): Promise<CustomerAddress[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  return listCustomerAddresses(user.id);
}

export async function saveCustomerAddressFromCheckout(
  userId: string,
  address: ShippingAddress,
): Promise<CustomerAddress | null> {
  if (!isSupabaseConfigured()) return null;

  const input = fromShippingAddress(address);
  const fingerprint = addressFingerprint(input);
  const existing = await listCustomerAddresses(userId);
  const match = existing.find((row) => addressFingerprint(row) === fingerprint);

  if (match) {
    await clearDefault(userId, match.id);
    const { data, error } = await db()
      .update({
        full_name: input.fullName,
        phone: input.phone,
        address_line1: input.addressLine1,
        address_line2: input.addressLine2 ?? null,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode,
        country: input.country,
        is_default: true,
      })
      .eq("id", match.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return mapAddressRow(data as Record<string, unknown>);
  }

  await clearDefault(userId);
  const { data, error } = await db()
    .insert(toInsert(userId, input, true))
    .select()
    .single();

  if (error) throw error;
  return mapAddressRow(data as Record<string, unknown>);
}

export async function deleteCustomerAddress(userId: string, id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { error } = await db().delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function setDefaultCustomerAddress(userId: string, id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  await clearDefault(userId, id);
  const { error } = await db()
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
