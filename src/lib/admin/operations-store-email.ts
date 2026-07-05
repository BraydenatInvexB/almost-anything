import type { EmailBroadcast, EmailSubscriber } from "@/lib/admin/operations-types";
import { state } from "@/lib/admin/operations-store-core";

export function listEmailSubscribers() {
  return state.emailSubscribers;
}

export function addEmailSubscriber(input: Omit<EmailSubscriber, "id" | "subscribedAt"> & { id?: string }) {
  const email = input.email.toLowerCase();
  const existing = state.emailSubscribers.find((s) => s.email === email);
  if (existing) {
    if (existing.status === "unsubscribed") {
      existing.status = "active";
      existing.subscribedAt = new Date().toISOString();
    }
    if (input.name && !existing.name) existing.name = input.name;
    return existing;
  }
  const subscriber: EmailSubscriber = {
    id: input.id ?? `sub-${Date.now()}`,
    email,
    name: input.name,
    source: input.source,
    status: input.status ?? "active",
    subscribedAt: new Date().toISOString(),
    tags: input.tags,
  };
  state.emailSubscribers.unshift(subscriber);
  return subscriber;
}

export function removeEmailSubscriber(id: string) {
  const idx = state.emailSubscribers.findIndex((s) => s.id === id);
  if (idx < 0) return false;
  state.emailSubscribers.splice(idx, 1);
  return true;
}

export function updateEmailSubscriber(id: string, patch: Partial<EmailSubscriber>) {
  const idx = state.emailSubscribers.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  state.emailSubscribers[idx] = { ...state.emailSubscribers[idx], ...patch };
  return state.emailSubscribers[idx];
}

export function listEmailBroadcasts() {
  return state.emailBroadcasts;
}

export function createEmailBroadcast(
  input: Omit<EmailBroadcast, "id" | "createdAt" | "recipientCount" | "status"> & {
    status?: EmailBroadcast["status"];
    recipientCount?: number;
  },
) {
  const broadcast: EmailBroadcast = {
    ...input,
    id: `eml-${Date.now()}`,
    status: input.status ?? "draft",
    recipientCount: input.recipientCount ?? 0,
    createdAt: new Date().toISOString(),
  };
  state.emailBroadcasts.unshift(broadcast);
  return broadcast;
}

export function updateEmailBroadcast(id: string, patch: Partial<EmailBroadcast>) {
  const idx = state.emailBroadcasts.findIndex((b) => b.id === id);
  if (idx < 0) return null;
  state.emailBroadcasts[idx] = { ...state.emailBroadcasts[idx], ...patch };
  return state.emailBroadcasts[idx];
}
