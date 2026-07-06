import { NextResponse } from "next/server";
import { getCurrentSeller } from "@/services/seller-service";
import { listUnreadSellerMessages, markSellerMessagesRead } from "@/services/admin/seller-messages";

export async function GET() {
  const seller = await getCurrentSeller();
  if (!seller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await listUnreadSellerMessages(seller.id);
  return NextResponse.json({ messages });
}

export async function PATCH(request: Request) {
  const seller = await getCurrentSeller();
  if (!seller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const messageIds = Array.isArray(body.messageIds)
    ? body.messageIds.filter((id: unknown) => typeof id === "string")
    : undefined;

  await markSellerMessagesRead(seller.id, messageIds);
  return NextResponse.json({ ok: true });
}
