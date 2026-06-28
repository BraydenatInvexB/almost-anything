"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CANNED_REPLIES } from "@/lib/support/helpdesk";

export function TicketReply({ ticketId, ticketStatus }: { ticketId: string; ticketStatus: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [resolve, setResolve] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/support/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, is_internal: internal, resolve: resolve && !internal }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to send");
        return;
      }
      setBody("");
      setResolve(false);
      router.refresh();
    } catch {
      setError("Network error — try again.");
    } finally {
      setSending(false);
    }
  }

  const closed = ticketStatus === "closed";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-100 px-4 py-3">
        <p className="text-sm font-semibold text-neutral-900">Reply to customer</p>
        <p className="text-xs text-neutral-500">Public replies are emailed to the customer. Internal notes stay in the helpdesk.</p>
      </div>

      {!internal && !closed ? (
        <div className="flex flex-wrap gap-2 border-b border-neutral-100 px-4 py-3">
          {CANNED_REPLIES.map((tpl) => (
            <button
              key={tpl.label}
              type="button"
              onClick={() => setBody(tpl.body)}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700 hover:border-neutral-300 hover:bg-white"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            internal
              ? "Add an internal note for your team…"
              : closed
                ? "Ticket is closed — add an internal note only."
                : "Write your reply to the customer…"
          }
          rows={5}
          disabled={closed && !internal}
          className={cn(
            "w-full resize-none rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20",
            internal ? "border-amber-200 bg-amber-50/50" : "border-neutral-200",
          )}
        />

        {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setInternal((v) => !v);
                if (!internal) setResolve(false);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                internal ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
              )}
            >
              <Lock className="h-3.5 w-3.5" />
              Internal note
            </button>
            {!internal && ticketStatus !== "closed" && ticketStatus !== "resolved" ? (
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                <input
                  type="checkbox"
                  checked={resolve}
                  onChange={(e) => setResolve(e.target.checked)}
                  className="rounded border-emerald-300"
                />
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark resolved after send
              </label>
            ) : null}
          </div>
          <button
            type="button"
            onClick={send}
            disabled={sending || !body.trim() || (closed && !internal)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {internal ? "Add note" : resolve ? "Send & resolve" : "Send reply"}
          </button>
        </div>
      </div>
    </div>
  );
}
