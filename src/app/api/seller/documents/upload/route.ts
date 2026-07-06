import { NextResponse } from "next/server";
import { getCurrentSeller, saveSellerDocument } from "@/services/seller-service";
import { uploadMarketplaceFile } from "@/lib/uploads/marketplace-upload";
import { parseDocumentType } from "@/lib/seller/document-compliance";

export async function POST(request: Request) {
  const seller = await getCurrentSeller();
  if (!seller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const sellerId = String(formData?.get("sellerId") ?? seller.id);

  if (sellerId !== seller.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  let docType;
  try {
    docType = parseDocumentType(String(formData?.get("docType") ?? "other"));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid document type" },
      { status: 400 },
    );
  }

  try {
    const uploaded = await uploadMarketplaceFile(file, "seller-docs", "doc");
    const doc = await saveSellerDocument(seller.id, docType, uploaded.fileName, uploaded.url);
    return NextResponse.json({ ok: true, document: doc });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 },
    );
  }
}
