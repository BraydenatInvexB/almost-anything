import { NextResponse } from "next/server";
import { requireApprovedSellerApi } from "@/services/seller/access-guard";
import { listUnreadSellerMessages, markSellerMessagesRead } from "@/services/admin/seller-messages";

export async function GET() {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;

  const messages = await listUnreadSellerMessages(seller.id);
  return NextResponse.json({ messages });
}

export async function PATCH(request: Request) {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;

  const body = await request.json().catch(() => ({}));
  const messageIds = Array.isArray(body.messageIds)
    ? body.messageIds.filter((id: unknown) => typeof id === "string")
    : undefined;

  await markSellerMessagesRead(seller.id, messageIds);
  return NextResponse.json({ ok: true });
}
