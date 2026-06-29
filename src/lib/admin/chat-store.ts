import type { LiveChatMessage, LiveChatSession } from "@/lib/admin/chat-types";

const sessions = new Map<string, LiveChatSession>();

function now() {
  return new Date().toISOString();
}

export function listChatSessions(): LiveChatSession[] {
  return [...sessions.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getChatSession(id: string): LiveChatSession | null {
  return sessions.get(id) ?? null;
}

export function createChatSession(input: { visitorName: string; visitorEmail: string }) {
  const id = `chat-${Date.now()}`;
  const session: LiveChatSession = {
    id,
    visitorName: input.visitorName.trim(),
    visitorEmail: input.visitorEmail.trim().toLowerCase(),
    status: "open",
    messages: [
      {
        id: `msg-${Date.now()}`,
        sessionId: id,
        authorType: "system",
        authorName: "Almost Anything",
        body: "Thanks for reaching out. A team member will join shortly.",
        createdAt: now(),
      },
    ],
    createdAt: now(),
    updatedAt: now(),
  };
  sessions.set(id, session);
  return session;
}

export function appendChatMessage(
  sessionId: string,
  input: { authorType: LiveChatMessage["authorType"]; authorName: string; body: string },
) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const msg: LiveChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sessionId,
    authorType: input.authorType,
    authorName: input.authorName,
    body: input.body.trim(),
    createdAt: now(),
  };
  session.messages.push(msg);
  session.updatedAt = now();
  return msg;
}

export function closeChatSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.status = "closed";
  session.updatedAt = now();
  return session;
}
