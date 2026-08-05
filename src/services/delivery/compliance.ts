import "server-only";

import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export type DriverDocumentStatus = "pending" | "approved" | "rejected";
export type DriverDocumentType = "drivers_licence" | "bank_proof";

export interface DriverComplianceDocument {
  id: string;
  type: DriverDocumentType;
  fileName: string;
  status: DriverDocumentStatus;
  url: string | null;
}

export interface DriverComplianceDetail {
  verificationStatus: string;
  licenceNumber: string | null;
  licenceExpiry: string | null;
  banking: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    branchCode: string;
    accountType: string;
  } | null;
  documents: DriverComplianceDocument[];
  readyForApproval: boolean;
}

const db = () => createServiceClient() as any;

export async function createDriverCompliance(input: {
  driverId: string;
  licenceNumber: string;
  licenceExpiry: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  accountType: "cheque" | "savings" | "transmission";
  licenceFile: File;
  bankProofFile: File;
}) {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
  const supabase = db();
  const allowed = new Set(["application/pdf", "image/jpeg", "image/png"]);
  for (const file of [input.licenceFile, input.bankProofFile]) {
    if (!allowed.has(file.type) || file.size > 8_000_000) {
      throw new Error("Documents must be PDF, JPG or PNG and no larger than 8 MB.");
    }
  }

  const uploads: Array<{ type: DriverDocumentType; file: File }> = [
    { type: "drivers_licence", file: input.licenceFile },
    { type: "bank_proof", file: input.bankProofFile },
  ];
  const documentRows: Record<string, unknown>[] = [];
  for (const upload of uploads) {
    const extension = upload.file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${input.driverId}/${upload.type}-${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from("driver-documents")
      .upload(path, Buffer.from(await upload.file.arrayBuffer()), {
        contentType: upload.file.type,
        upsert: false,
      });
    if (error) throw new Error(error.message);
    documentRows.push({
      driver_id: input.driverId,
      document_type: upload.type,
      storage_path: path,
      file_name: upload.file.name,
      mime_type: upload.file.type,
      status: "pending",
    });
  }

  const { error: profileError } = await supabase.from("driver_private_profiles").upsert({
    driver_id: input.driverId,
    bank_name: input.bankName.trim(),
    account_holder: input.accountHolder.trim(),
    account_number: input.accountNumber.trim(),
    branch_code: input.branchCode.trim(),
    account_type: input.accountType,
    updated_at: new Date().toISOString(),
  });
  if (profileError) throw new Error(profileError.message);
  const { error: docError } = await supabase.from("driver_documents").insert(documentRows);
  if (docError) throw new Error(docError.message);
  const { error: driverError } = await supabase.from("drivers").update({
    licence_number: input.licenceNumber.trim(),
    licence_expiry: input.licenceExpiry,
    verification_status: "pending",
    updated_at: new Date().toISOString(),
  }).eq("id", input.driverId);
  if (driverError) throw new Error(driverError.message);
}

export async function getDriverCompliance(driverId: string): Promise<DriverComplianceDetail> {
  const supabase = db();
  const [{ data: driver }, { data: banking }, { data: rows }] = await Promise.all([
    supabase.from("drivers").select("verification_status,licence_number,licence_expiry").eq("id", driverId).maybeSingle(),
    supabase.from("driver_private_profiles").select("*").eq("driver_id", driverId).maybeSingle(),
    supabase.from("driver_documents").select("*").eq("driver_id", driverId).order("created_at", { ascending: false }),
  ]);
  const documents = await Promise.all((rows ?? []).map(async (row: any) => {
    const { data } = await supabase.storage.from("driver-documents").createSignedUrl(row.storage_path, 600);
    return {
      id: row.id,
      type: row.document_type,
      fileName: row.file_name,
      status: row.status,
      url: data?.signedUrl ?? null,
    } as DriverComplianceDocument;
  }));
  const latest = new Map<DriverDocumentType, DriverComplianceDocument>();
  for (const document of documents) if (!latest.has(document.type)) latest.set(document.type, document);
  const requiredApproved = ["drivers_licence", "bank_proof"].every(
    (type) => latest.get(type as DriverDocumentType)?.status === "approved",
  );
  return {
    verificationStatus: driver?.verification_status ?? "incomplete",
    licenceNumber: driver?.licence_number ?? null,
    licenceExpiry: driver?.licence_expiry ?? null,
    banking: banking ? {
      bankName: banking.bank_name,
      accountHolder: banking.account_holder,
      accountNumber: banking.account_number,
      branchCode: banking.branch_code,
      accountType: banking.account_type,
    } : null,
    documents,
    readyForApproval: Boolean(banking && driver?.licence_number && driver?.licence_expiry && requiredApproved),
  };
}

export async function reviewDriverDocument(documentId: string, status: "approved" | "rejected") {
  const supabase = db();
  const { data, error } = await supabase.from("driver_documents").update({
    status,
    reviewed_at: new Date().toISOString(),
  }).eq("id", documentId).select("driver_id").single();
  if (error) return { error: error.message };
  const compliance = await getDriverCompliance(data.driver_id);
  await supabase.from("drivers").update({
    verification_status: compliance.readyForApproval ? "approved" : status === "rejected" ? "rejected" : "pending",
    updated_at: new Date().toISOString(),
  }).eq("id", data.driver_id);
  return { ok: true } as const;
}
