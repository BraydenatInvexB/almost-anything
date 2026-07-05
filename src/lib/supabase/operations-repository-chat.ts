import type { LiveChatMessage, LiveChatSession } from "@/lib/admin/chat-types";
import {
  mapChatMessageRow,
  mapChatSessionRow,
} from "@/lib/supabase/operations-mappers";
import { asRow, asRows, tbl } from "@/lib/supabase/operations-repository-shared";

export async function listChatSessions(): Promise<LiveChatSession[]> {
  const { data: sessions, error } = await tbl("live_chat_sessions")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const sessionRows = asRows(sessions);
  if (!sessionRows.length) return [];

  const ids = sessionRows.map((s) => String(s.id));
  const { data: messages } = await tbl("live_chat_messages")
    .select("*")
    .in("session_id", ids)
    .order("created_at", { ascending: true });

  const bySession = new Map<string, LiveChatMessage[]>();
  for (const m of asRows(messages)) {
    const msg = mapChatMessageRow(m);
    const list = bySession.get(msg.sessionId) ?? [];
    list.push(msg);
    bySession.set(msg.sessionId, list);
  }

  return sessionRows.map((s) =>
    mapChatSessionRow(s, bySession.get(String(s.id)) ?? []),
  );
}

export async function getChatSession(id: string): Promise<LiveChatSession | null> {
  const { data: session, error } = await tbl("live_chat_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!session) return null;

  const { data: messages } = await tbl("live_chat_messages")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  return mapChatSessionRow(
    asRow(session),
    asRows(messages).map((m) => mapChatMessageRow(m)),
  );
}

export async function createChatSession(input: {
  visitorName: string;
  visitorEmail: string;
}): Promise<LiveChatSession> {
  const now = new Date().toISOString();
  const { data: session, error } = await tbl("live_chat_sessions")
    .insert({
      visitor_name: input.visitorName.trim(),
      visitor_email: input.visitorEmail.trim().toLowerCase(),
      status: "open",
    })
    .select()
    .single();
  if (error) throw error;

  const sessionRow = asRow(session);
  const sessionId = String(sessionRow.id);
  const { data: msg } = await tbl("live_chat_messages")
    .insert({
      session_id: sessionId,
      author_type: "system",
      author_name: "Almost Anything",
      body: "Thanks for reaching out. A team member will join shortly.",
      created_at: now,
    })
    .select()
    .single();

  return mapChatSessionRow(sessionRow, [
    mapChatMessageRow(asRow(msg)),
  ]);
}

export async function appendChatMessage(
  sessionId: string,
  input: { authorType: LiveChatMessage["authorType"]; authorName: string; body: string },
): Promise<LiveChatMessage | null> {
  const { data, error } = await tbl("live_chat_messages")
    .insert({
      session_id: sessionId,
      author_type: input.authorType,
      author_name: input.authorName,
      body: input.body.trim(),
    })
    .select()
    .single();
  if (error) throw error;

  await tbl("live_chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  return mapChatMessageRow(asRow(data));
}

export async function closeChatSession(sessionId: string): Promise<LiveChatSession | null> {
  const { data, error } = await tbl("live_chat_sessions")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return getChatSession(sessionId);
}
