import { NextResponse } from "next/server";
import { getCurrentSeller, listSellerDocuments } from "@/services/seller-service";
import { evaluateSellerAccess } from "@/lib/seller/seller-access";

export async function requireApprovedSellerApi() {
  const seller = await getCurrentSeller();
  if (!seller) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const documents = await listSellerDocuments(seller.id);
  const access = evaluateSellerAccess(seller, documents);

  if (!access.canUseDashboard) {
    return {
      error: NextResponse.json(
        {
          error:
            access.phase === "submit_documents"
              ? "Submit required verification documents to continue."
              : "Your seller account is awaiting admin approval.",
        },
        { status: 403 },
      ),
    };
  }

  return { seller };
}
