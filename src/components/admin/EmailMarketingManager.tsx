"use client";

import { useMemo, useState } from "react";
import { Plus, Send, Trash2, Users } from "lucide-react";
import type { DemoCustomer } from "@/lib/admin/demo-data";
import type { EmailAudience, EmailBroadcast, EmailSubscriber } from "@/lib/admin/operations-types";
import { BtnPrimary, StatusBadge, Td, Th } from "@/components/admin/ui";

const AUDIENCE_LABELS: Record<EmailAudience, string> = {
  all: "Everyone (subscribers + customers)",
  subscribers: "Newsletter subscribers only",
  customers: "All customers",
  vip: "VIP customers",
  active_customers: "Customers with recent orders",
};

interface EmailMarketingManagerProps {
  subscribers: EmailSubscriber[];
  broadcasts: EmailBroadcast[];
  customers: DemoCustomer[];
  canManage: boolean;
  staffName: string;
}

export function EmailMarketingManager({
  subscribers: initialSubscribers,
  broadcasts: initialBroadcasts,
  customers,
  canManage,
  staffName,
}: EmailMarketingManagerProps) {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [broadcasts, setBroadcasts] = useState(initialBroadcasts);
  const [tab, setTab] = useState<"list" | "compose" | "sent">("list");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<EmailAudience>("all");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const audienceCount = useMemo(() => {
    const emails = new Set<string>();
    const add = (email?: string | null) => {
      if (email) emails.add(email.toLowerCase());
    };

    if (audience === "subscribers" || audience === "all") {
      subscribers.filter((s) => s.status === "active").forEach((s) => add(s.email));
    }
    if (audience === "customers" || audience === "all" || audience === "active_customers") {
      customers.forEach((c) => add(c.email));
    }
    if (audience === "vip") {
      customers.filter((c) => c.status === "vip").forEach((c) => add(c.email));
    }
    if (audience === "active_customers") {
      customers
        .filter((c) => c.last_order_at)
        .forEach((c) => add(c.email));
    }
    return emails.size;
  }, [audience, subscribers, customers]);

  async function addSubscriber(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage || !newEmail.trim()) return;
    const res = await fetch("/api/admin/email/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim(), name: newName.trim() || undefined, source: "manual" }),
    });
    const data = await res.json();
    if (data.subscriber) {
      setSubscribers((list) => {
        const filtered = list.filter((s) => s.email !== data.subscriber.email);
        return [data.subscriber, ...filtered];
      });
      setNewEmail("");
      setNewName("");
    }
  }

  async function removeSubscriber(id: string) {
    if (!canManage) return;
    await fetch(`/api/admin/email/subscribers?id=${id}`, { method: "DELETE" });
    setSubscribers((list) => list.filter((s) => s.id !== id));
  }

  async function sendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setSending(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/email/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          previewText,
          body,
          audience,
          send: true,
          createdBy: staffName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Failed to send");
        return;
      }
      if (data.broadcast) {
        setBroadcasts((list) => [data.broadcast, ...list]);
        setSubject("");
        setPreviewText("");
        setBody("");
        setTab("sent");
        setMessage(`Sent to ${data.broadcast.recipientCount} recipients.`);
      }
    } finally {
      setSending(false);
    }
  }

  async function saveDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    const res = await fetch("/api/admin/email/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        previewText,
        body,
        audience,
        send: false,
        createdBy: staffName,
      }),
    });
    const data = await res.json();
    if (data.broadcast) {
      setBroadcasts((list) => [data.broadcast, ...list]);
      setMessage("Draft saved.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["list", "compose", "sent"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              tab === key ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {key === "list" ? "Email list" : key === "compose" ? "Compose email" : "Sent history"}
          </button>
        ))}
      </div>

      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}

      {tab === "list" ? (
        <div className="space-y-4">
          {canManage ? (
            <form onSubmit={addSubscriber} className="flex flex-wrap gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <input
                className="input min-w-[200px] flex-1"
                type="email"
                placeholder="Email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <input
                className="input min-w-[160px] flex-1"
                placeholder="Name (optional)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <BtnPrimary type="submit">
                <Plus className="h-4 w-4" /> Add to list
              </BtnPrimary>
            </form>
          ) : null}

          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-left">
                  <Th>Email</Th>
                  <Th>Name</Th>
                  <Th>Source</Th>
                  <Th>Status</Th>
                  {canManage ? <Th /> : null}
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.id} className="border-b border-neutral-50">
                    <Td className="font-medium">{s.email}</Td>
                    <Td>{s.name ?? "—"}</Td>
                    <Td className="capitalize">{s.source}</Td>
                    <Td>
                      <StatusBadge status={s.status} />
                    </Td>
                    {canManage ? (
                      <Td>
                        <button
                          type="button"
                          onClick={() => removeSubscriber(s.id)}
                          className="text-neutral-400 hover:text-red-600"
                          aria-label="Remove subscriber"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-neutral-500">
            <Users className="mr-1 inline h-3.5 w-3.5" />
            {subscribers.filter((s) => s.status === "active").length} active subscribers ·{" "}
            {customers.length} customers in CRM (included when sending to customers or everyone)
          </p>
        </div>
      ) : null}

      {tab === "compose" ? (
        <form onSubmit={sendBroadcast} className="space-y-4 rounded-lg border border-neutral-200 p-5">
          <div>
            <label className="text-xs font-semibold text-neutral-600">Send to</label>
            <select
              className="input mt-1"
              value={audience}
              onChange={(e) => setAudience(e.target.value as EmailAudience)}
              disabled={!canManage}
            >
              {Object.entries(AUDIENCE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-neutral-500">Estimated recipients: {audienceCount}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-600">Subject</label>
            <input
              className="input mt-1"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Summer deals are live"
              required
              disabled={!canManage}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-600">Preview text</label>
            <input
              className="input mt-1"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Short line shown in inbox previews"
              disabled={!canManage}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-600">Message</label>
            <textarea
              className="input mt-1 min-h-[160px] resize-y"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write what you want customers to receive…"
              required
              disabled={!canManage}
            />
          </div>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <BtnPrimary type="submit" disabled={sending}>
                <Send className="h-4 w-4" />
                {sending ? "Sending…" : "Send now"}
              </BtnPrimary>
              <button
                type="button"
                onClick={saveDraft}
                className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Save draft
              </button>
            </div>
          ) : null}
        </form>
      ) : null}

      {tab === "sent" ? (
        <div className="space-y-3">
          {broadcasts.length === 0 ? (
            <p className="text-sm text-neutral-500">No emails sent yet.</p>
          ) : (
            broadcasts.map((b) => (
              <div key={b.id} className="rounded-lg border border-neutral-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-neutral-900">{b.subject}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {AUDIENCE_LABELS[b.audience]} · {b.recipientCount} recipients
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                {b.previewText ? (
                  <p className="mt-2 text-sm text-neutral-600">{b.previewText}</p>
                ) : null}
                <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">{b.body}</p>
                <p className="mt-3 text-[11px] text-neutral-400">
                  {b.sentAt
                    ? `Sent ${new Date(b.sentAt).toLocaleString()}`
                    : `Created ${new Date(b.createdAt).toLocaleString()}`}
                  {b.createdBy ? ` · ${b.createdBy}` : ""}
                </p>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
