"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { BtnPrimary, BtnSecondary } from "@/components/admin/ui";

export function SellerNeedsAttentionButton({
  sellerId,
  shopName,
  disabled,
}: {
  sellerId: string;
  shopName: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function openDialog() {
    setSubject(`Action required: ${shopName}`);
    setBody("");
    setMessage("");
    setError("");
    setOpen(true);
  }

  async function send() {
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, priority: "action_required" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send message");
      setMessage("Message sent to seller.");
      setTimeout(() => setOpen(false), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <BtnSecondary
        type="button"
        disabled={disabled}
        onClick={openDialog}
        className="border-neutral-900 bg-white text-[11px] font-bold uppercase tracking-wide shadow-[3px_3px_0_0_#111]"
      >
        <AlertCircle className="h-3.5 w-3.5" />
        Needs attention
      </BtnSecondary>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-neutral-950">Send to {shopName}</h3>
            <p className="mt-1 text-sm text-neutral-600">
              This appears on the seller dashboard as an action-required message.
            </p>
            <div className="mt-4 space-y-3">
              <input
                className="input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
              />
              <textarea
                className="input min-h-28 resize-y"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Explain what the seller needs to fix or upload…"
              />
            </div>
            {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <BtnPrimary type="button" disabled={sending || !subject.trim() || !body.trim()} onClick={() => void send()}>
                {sending ? "Sending…" : "Send message"}
              </BtnPrimary>
              <BtnSecondary type="button" onClick={() => setOpen(false)}>
                Cancel
              </BtnSecondary>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
