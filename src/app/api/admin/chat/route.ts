import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import {
  appendChatMessage,
  closeChatSession,
  getChatSession,
  listChatSessions,
} from "@/lib/admin/operations-persistence";

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "support.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ sessions: await listChatSessions() });
}

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "support.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.sessionId || !body?.message) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const msg = await appendChatMessage(body.sessionId, {
    authorType: "staff",
    authorName: staff.full_name,
    body: body.message,
  });
  if (!msg) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json({ ok: true, message: msg, session: await getChatSession(body.sessionId) });
}

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "support.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  if (body.action === "close") {
    const session = await closeChatSession(body.sessionId);
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, session });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
