import { createClient } from "@/lib/supabase/server";
import {
  applicationToSellerInsert,
  mapSellerDocument,
  mapSellerRow,
} from "@/lib/seller/seller-mapper";
import { sellerDb } from "@/lib/seller/db";
import type { SellerApplicationInput, SellerDocument, SellerProfile } from "@/types/seller";

export async function submitSellerApplication(
  input: SellerApplicationInput,
): Promise<SellerProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to apply as a seller");

  const db = sellerDb();
  const { data: existing, error: existingError } = await db
    .from("sellers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) throw new Error("You already have a seller application on file");

  const { data, error } = await db
    .from("sellers")
    .insert(applicationToSellerInsert(user.id, input))
    .select("*")
    .single();

  if (error) throw error;

  const { error: teamError } = await db.from("seller_team_members").insert({
    seller_id: data.id,
    user_id: user.id,
    email: input.contactEmail.trim().toLowerCase(),
    full_name: input.shopName.trim(),
    role: "owner",
    status: "active",
    permissions: [],
  });

  if (teamError) throw teamError;

  return mapSellerRow(data as Record<string, unknown>);
}

export async function saveSellerDocument(
  sellerId: string,
  docType: SellerDocument["docType"],
  fileName: string,
  fileUrl: string,
): Promise<SellerDocument> {
  const { data, error } = await sellerDb()
    .from("seller_documents")
    .insert({
      seller_id: sellerId,
      doc_type: docType,
      file_name: fileName,
      file_url: fileUrl,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapSellerDocument(data as Record<string, unknown>);
}

export async function listSellerDocuments(sellerId: string): Promise<SellerDocument[]> {
  const { data, error } = await sellerDb()
    .from("seller_documents")
    .select("*")
    .eq("seller_id", sellerId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapSellerDocument(row as Record<string, unknown>));
}
