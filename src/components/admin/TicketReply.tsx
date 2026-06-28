"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function TicketReply({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/admin/support/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, is_internal: internal }),
      });
    } catch {
      /* demo tolerant */
    }
    setBody("");
    setSending(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={internal ? "Add an internal note (only staff can see this)..." : "Write a reply to the customer..."}
        rows={4}
        className={cn(
          "w-full resize-none rounded-xl border p-3 text-sm focus:outline-none",
          internal ? "border-amber-200 bg-amber-50" : "border-neutral-200",
        )}
      />
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => setInternal((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            internal ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-500",
          )}
        >
          <Lock className="h-3.5 w-3.5" />
          Internal note
        </button>
        <button
          onClick={send}
          disabled={sending || !body.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {internal ? "Add note" : "Send reply"}
        </button>
      </div>
    </div>
  );
}
