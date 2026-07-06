"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { SellerMessage, SellerMessagePriority } from "@/types/seller-admin";

const PRIORITIES: { id: SellerMessagePriority; label: string }[] = [
  { id: "normal", label: "Normal" },
  { id: "important", label: "Important" },
  { id: "action_required", label: "Action required" },
];

export function SellerAdminMessagesTab({
  sellerId,
  canManage,
}: {
  sellerId: string;
  canManage: boolean;
}) {
  const [messages, setMessages] = useState<SellerMessage[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<SellerMessagePriority>("normal");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadMessages() {
    const res = await fetch(`/api/admin/sellers/${sellerId}/messages`);
    const data = await res.json();
    setMessages(data.messages ?? []);
  }

  useEffect(() => {
    loadMessages().finally(() => setLoading(false));
  }, [sellerId]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, priority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setSubject("");
      setBody("");
      setPriority("normal");
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {canManage ? (
        <Card variant="elevated" className="p-6">
          <h2 className="text-lg font-semibold">Message seller</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Messages appear on the seller dashboard so your team can enforce marketplace standards.
          </p>
          <form onSubmit={(e) => void sendMessage(e)} className="mt-4 space-y-3">
            <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required className="rounded-xl" />
            <textarea
              className="min-h-32 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              placeholder="Explain what the seller needs to fix or update…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="priority" checked={priority === item.id} onChange={() => setPriority(item.id)} />
                  {item.label}
                </label>
              ))}
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button type="submit" isLoading={sending}>Send message</Button>
          </form>
        </Card>
      ) : null}

      <Card variant="elevated" className="p-6 lg:col-span-2 xl:col-span-1">
        <h2 className="text-lg font-semibold">Message history</h2>
        {loading ? (
          <p className="mt-4 text-sm text-neutral-500">Loading…</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {messages.map((message) => (
              <li key={message.id} className="rounded-xl border border-neutral-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{message.subject}</p>
                  <span className="text-xs uppercase tracking-wide text-neutral-400">{message.priority.replace("_", " ")}</span>
                </div>
                <p className="mt-2 text-sm text-neutral-700 whitespace-pre-wrap">{message.body}</p>
                <p className="mt-3 text-xs text-neutral-400">
                  {message.senderName} · {new Date(message.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
            {!messages.length ? <p className="text-sm text-neutral-500">No messages yet.</p> : null}
          </ul>
        )}
      </Card>
    </div>
  );
}
