"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { Campaign } from "@/lib/admin/operations-types";
import { BtnPrimary, StatusBadge } from "@/components/admin/ui";

export function CampaignManager({
  initial,
  canManage,
}: {
  initial: Campaign[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    channel: "email" as Campaign["channel"],
    status: "draft" as Campaign["status"],
    promoCode: "",
    discountPercent: "",
    audience: "All customers",
    startsAt: new Date().toISOString().slice(0, 10),
  });

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        startsAt: new Date(form.startsAt).toISOString(),
        discountPercent: form.discountPercent ? Number(form.discountPercent) : undefined,
        promoCode: form.promoCode || undefined,
      }),
    });
    const data = await res.json();
    if (data.campaign) {
      setCampaigns((c) => [data.campaign, ...c]);
      setShowForm(false);
      router.refresh();
    }
  }

  async function setStatus(id: string, status: Campaign["status"]) {
    const res = await fetch("/api/admin/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (data.campaign) {
      setCampaigns((list) => list.map((c) => (c.id === id ? data.campaign : c)));
    }
  }

  async function remove(id: string) {
    await fetch(`/api/admin/campaigns?id=${id}`, { method: "DELETE" });
    setCampaigns((list) => list.filter((c) => c.id !== id));
  }

  return (
    <div>
      {canManage && (
        <div className="border-b border-neutral-100 px-5 py-4">
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> New campaign
            </button>
          ) : (
            <form onSubmit={createCampaign} className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="Campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <select className="input" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as Campaign["channel"] })}>
                <option value="email">Email</option>
                <option value="banner">Banner</option>
                <option value="push">Push</option>
                <option value="sms">SMS</option>
                <option value="multi">Multi-channel</option>
              </select>
              <input className="input" placeholder="Promo code (optional)" value={form.promoCode} onChange={(e) => setForm({ ...form, promoCode: e.target.value })} />
              <input className="input" type="number" placeholder="Discount %" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} />
              <input className="input" placeholder="Audience" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
              <input className="input" type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              <div className="flex gap-2 sm:col-span-2">
                <BtnPrimary type="submit">Create campaign</BtnPrimary>
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-neutral-500">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="divide-y divide-neutral-100">
        {campaigns.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-neutral-950">{c.name}</p>
              <p className="text-xs text-neutral-500">
                {c.channel} · {c.audience}
                {c.promoCode ? ` · Code: ${c.promoCode}` : ""}
                {c.discountPercent ? ` · ${c.discountPercent}% off` : ""}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold tabular-nums">{c.reach.toLocaleString()}</p>
              <p className="text-xs text-neutral-400">reach</p>
            </div>
            <StatusBadge status={c.status} />
            {canManage && (
              <div className="flex gap-1">
                {c.status !== "live" && (
                  <button type="button" onClick={() => setStatus(c.id, "live")} className="rounded-lg border px-2 py-1 text-xs font-semibold hover:bg-neutral-50">
                    Go live
                  </button>
                )}
                {c.status === "live" && (
                  <button type="button" onClick={() => setStatus(c.id, "ended")} className="rounded-lg border px-2 py-1 text-xs font-semibold hover:bg-neutral-50">
                    End
                  </button>
                )}
                <button type="button" onClick={() => remove(c.id)} className="rounded-lg p-1 text-red-500 hover:bg-red-50" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
