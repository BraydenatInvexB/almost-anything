import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff } from "@/services/admin-service";
import { getSellerAdminDetail, updateSellerDocumentStatus } from "@/services/admin/sellers";
import { staffCan } from "@/config/rbac";

const patchSchema = z.object({
  documentId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  notes: z.string().max(500).optional(),
});

export async function PATCH(request: NextRequest) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "sellers.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const status = parsed.data.action === "approve" ? "approved" : "rejected";
  const document = await updateSellerDocumentStatus(parsed.data.documentId, status, parsed.data.notes);

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const detail = await getSellerAdminDetail(document.sellerId);
  return NextResponse.json({ ok: true, document, ...detail });
}
