"use client";

import { useEffect, useState } from "react";
import type { LiveChatSession } from "@/lib/admin/chat-types";

export function LiveChatInbox({ canManage }: { canManage: boolean }) {
  const [sessions, setSessions] = useState<LiveChatSession[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/chat");
    const data = await res.json();
    setSessions(data.sessions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  const current = sessions.find((s) => s.id === active);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !reply.trim()) return;
    await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: active, message: reply }),
    });
    setReply("");
    await load();
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm lg:col-span-1">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-neutral-950">Live chat</h3>
          <p className="text-xs text-neutral-500">{sessions.filter((s) => s.status === "open").length} open</p>
        </div>
        <ul className="max-h-80 divide-y divide-neutral-100 overflow-y-auto">
          {loading && <li className="p-4 text-sm text-neutral-500">Loading…</li>}
          {!loading && sessions.length === 0 && (
            <li className="p-4 text-sm text-neutral-500">No live chats yet.</li>
          )}
          {sessions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setActive(s.id)}
                className={`w-full px-4 py-3 text-left hover:bg-neutral-50 ${
                  active === s.id ? "bg-brand/5" : ""
                }`}
              >
                <p className="font-semibold text-neutral-950">{s.visitorName}</p>
                <p className="text-xs text-neutral-500">{s.visitorEmail}</p>
                <p className="mt-1 truncate text-xs text-neutral-400">
                  {s.messages[s.messages.length - 1]?.body}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm lg:col-span-2">
        {current ? (
          <>
            <div className="border-b border-neutral-100 px-4 py-3">
              <p className="font-semibold">{current.visitorName}</p>
              <p className="text-xs text-neutral-500">{current.visitorEmail}</p>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto p-4">
              {current.messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    m.authorType === "staff"
                      ? "ml-auto bg-brand text-white"
                      : m.authorType === "visitor"
                        ? "bg-neutral-100"
                        : "bg-neutral-50 text-neutral-500 italic"
                  }`}
                >
                  <p className="text-[10px] font-semibold opacity-70">{m.authorName}</p>
                  <p>{m.body}</p>
                </div>
              ))}
            </div>
            {canManage && current.status === "open" && (
              <form onSubmit={sendReply} className="flex gap-2 border-t border-neutral-100 p-3">
                <input
                  className="h-10 flex-1 rounded-lg border border-neutral-200 px-3 text-sm"
                  placeholder="Reply to customer…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <button type="submit" className="rounded-lg bg-brand px-4 text-sm font-semibold text-white">
                  Send
                </button>
              </form>
            )}
          </>
        ) : (
          <p className="p-8 text-center text-sm text-neutral-500">Select a conversation</p>
        )}
      </div>
    </div>
  );
}
