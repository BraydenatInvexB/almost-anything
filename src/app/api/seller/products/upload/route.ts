import { NextResponse } from "next/server";
import { requireApprovedSellerApi } from "@/services/seller/access-guard";
import { sellerCan } from "@/config/seller-rbac";
import { uploadProductImage } from "@/lib/uploads/marketplace-upload";

export async function POST(request: Request) {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;
  if (!sellerCan(seller, "products.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const url = await uploadProductImage(file);
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 },
    );
  }
}
