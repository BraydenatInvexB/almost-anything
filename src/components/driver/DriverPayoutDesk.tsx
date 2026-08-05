"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DriverPayoutSummary } from "@/services/delivery/payouts";

export function DriverPayoutDesk({ summary, canRequest }: { summary: DriverPayoutSummary; canRequest: boolean }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit() {
    setLoading(true); setMessage("");
    const response = await fetch("/api/driver/payouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: Number(amount) }) });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Payout request submitted for admin review." : body.error ?? "Request failed.");
    setLoading(false);
    if (response.ok) { setAmount(""); router.refresh(); }
  }
  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Total earned", summary.earned, "R100 standard and R200 large deliveries"],["Available", summary.available, "Ready to request"],["Requested", summary.committed, "Pending, approved and paid"],["Paid", summary.paid, "Sent to your bank"]].map(([label, value, note]) => <div key={String(label)} className="rounded-2xl border border-neutral-200 bg-white p-4"><p className="text-xs font-semibold text-neutral-500">{label}</p><p className="mt-2 text-2xl font-bold">R {Number(value).toFixed(2)}</p><p className="mt-1 text-xs text-neutral-500">{note}</p></div>)}</div>
    <section className="rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="text-lg font-bold">Request a payout</h2><p className="mt-1 text-sm text-neutral-500">Funds are paid to the verified bank account supplied in your driver application.</p>{canRequest ? <div className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row"><input type="number" min="1" max={summary.available} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount in rand" className="w-full rounded-xl border border-neutral-200 px-4 py-3" /><button disabled={loading || Number(amount) <= 0 || Number(amount) > summary.available} onClick={() => void submit()} className="rounded-xl bg-brand px-5 py-3 font-semibold text-white disabled:opacity-40">{loading ? "Submitting…" : "Request payout"}</button></div> : <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Payouts unlock after your documents and banking details are approved.</p>}{message ? <p className="mt-3 text-sm text-neutral-700">{message}</p> : null}</section>
    <section className="rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="text-lg font-bold">Payout history</h2><div className="mt-4 divide-y divide-neutral-100">{summary.requests.length ? summary.requests.map((request) => <div key={request.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-semibold">R {request.amount.toFixed(2)}</p><p className="text-xs text-neutral-500">{new Date(request.requestedAt).toLocaleDateString("en-ZA")}</p></div><span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold capitalize">{request.status}</span></div>) : <p className="py-4 text-sm text-neutral-500">No payout requests yet.</p>}</div></section>
  </div>;
}
