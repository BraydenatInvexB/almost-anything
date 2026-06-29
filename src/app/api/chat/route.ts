import { NextResponse } from "next/server";
import {
  appendChatMessage,
  createChatSession,
  getChatSession,
} from "@/lib/admin/operations-persistence";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (body?.sessionId && body?.message) {
    const session = await getChatSession(body.sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    await appendChatMessage(body.sessionId, {
      authorType: "visitor",
      authorName: body.visitorName ?? session.visitorName,
      body: body.message,
    });
    return NextResponse.json({ session: await getChatSession(body.sessionId) });
  }

  if (!body?.visitorName || !body?.visitorEmail) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }
  const session = await createChatSession({
    visitorName: body.visitorName,
    visitorEmail: body.visitorEmail,
  });
  if (body.message?.trim()) {
    await appendChatMessage(session.id, {
      authorType: "visitor",
      authorName: body.visitorName,
      body: body.message,
    });
  }
  return NextResponse.json({ sessionId: session.id, session: await getChatSession(session.id) });
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("sessionId");
  if (!id) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  const session = await getChatSession(id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ session });
}
