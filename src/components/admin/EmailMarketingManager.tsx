"use client";

import { useMemo, useState } from "react";
import type { DemoCustomer } from "@/lib/admin/demo-data";
import type { EmailAudience, EmailBroadcast, EmailSubscriber } from "@/lib/admin/operations-types";
import { EmailMarketingListTab } from "@/components/admin/EmailMarketingListTab";
import { EmailMarketingComposeTab } from "@/components/admin/EmailMarketingComposeTab";
import { EmailMarketingSentTab } from "@/components/admin/EmailMarketingSentTab";

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
        <EmailMarketingListTab
          subscribers={subscribers}
          customers={customers}
          canManage={canManage}
          newEmail={newEmail}
          newName={newName}
          onNewEmailChange={setNewEmail}
          onNewNameChange={setNewName}
          onAddSubscriber={addSubscriber}
          onRemoveSubscriber={removeSubscriber}
        />
      ) : null}

      {tab === "compose" ? (
        <EmailMarketingComposeTab
          canManage={canManage}
          audience={audience}
          audienceCount={audienceCount}
          subject={subject}
          previewText={previewText}
          body={body}
          sending={sending}
          onAudienceChange={setAudience}
          onSubjectChange={setSubject}
          onPreviewTextChange={setPreviewText}
          onBodyChange={setBody}
          onSend={sendBroadcast}
          onSaveDraft={saveDraft}
        />
      ) : null}

      {tab === "sent" ? <EmailMarketingSentTab broadcasts={broadcasts} /> : null}
    </div>
  );
}
