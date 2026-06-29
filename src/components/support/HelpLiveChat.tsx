"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

export function HelpLiveChat() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    { authorName: string; body: string; authorType: string; createdAt: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!sessionId || !open) return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.session?.messages ?? []);
    }, 3000);
    return () => clearInterval(t);
  }, [sessionId, open]);

  async function startChat(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorName: name, visitorEmail: email, message: input }),
      });
      const data = await res.json();
      if (data.sessionId) {
        setSessionId(data.sessionId);
        setMessages(data.session?.messages ?? []);
        setInput("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || !input.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          visitorName: name,
          message: input,
        }),
      });
      const data = await res.json();
      setMessages(data.session?.messages ?? messages);
      setInput("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition hover:scale-105"
        aria-label="Open live chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-brand px-4 py-3 text-white">
            <div>
              <p className="font-semibold">Live chat</p>
              <p className="text-xs text-white/80">We typically reply within minutes</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="h-5 w-5" />
            </button>
          </div>

          {!sessionId ? (
            <form onSubmit={startChat} className="flex flex-1 flex-col gap-3 p-4">
              <p className="text-sm text-neutral-600">Start a conversation with our support team.</p>
              <input
                className="h-10 rounded-lg border border-neutral-200 px-3 text-sm"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="email"
                className="h-10 rounded-lg border border-neutral-200 px-3 text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <textarea
                className="min-h-[80px] flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                placeholder="How can we help?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-brand py-2.5 text-sm font-semibold text-white"
              >
                Start chat
              </button>
            </form>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div
                    key={m.createdAt + m.body}
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      m.authorType === "visitor"
                        ? "ml-auto bg-brand text-white"
                        : "bg-neutral-100 text-neutral-800"
                    }`}
                  >
                    <p className="text-[10px] font-semibold opacity-70">{m.authorName}</p>
                    <p>{m.body}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendMessage} className="flex gap-2 border-t border-neutral-100 p-3">
                <input
                  className="h-10 flex-1 rounded-lg border border-neutral-200 px-3 text-sm"
                  placeholder="Type a message…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
