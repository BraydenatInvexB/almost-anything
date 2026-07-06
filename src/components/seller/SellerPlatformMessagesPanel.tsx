"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SellerPanel, SellerPanelBody } from "@/components/seller/SellerPanel";
import type { SellerMessage } from "@/types/seller-admin";

export function SellerPlatformMessagesPanel() {
  const [messages, setMessages] = useState<SellerMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seller/messages")
      .then((r) => r.json())
      .then((data) => setMessages(data.messages ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function markRead() {
    await fetch("/api/seller/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageIds: messages.map((m) => m.id) }),
    });
    setMessages([]);
  }

  if (loading || !messages.length) return null;

  return (
    <SellerPanel className="border-brand/20 bg-brand/[0.03]">
      <SellerPanelBody className="py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-brand" />
            <div>
              <p className="font-semibold text-neutral-900">Messages from Almost Anything</p>
              <p className="mt-1 text-sm text-neutral-600">
                Our marketplace team has sent updates about your shop or listings.
              </p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => void markRead()}>Mark all read</Button>
        </div>
        <ul className="mt-4 space-y-3">
          {messages.map((message) => (
            <li key={message.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-neutral-900">{message.subject}</p>
                <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                  {message.priority.replace("_", " ")}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">{message.body}</p>
              <p className="mt-3 text-xs text-neutral-400">
                {message.senderName} · {new Date(message.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </SellerPanelBody>
    </SellerPanel>
  );
}
