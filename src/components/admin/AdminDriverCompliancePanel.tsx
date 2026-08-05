"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DriverComplianceDetail } from "@/services/delivery/compliance";
import type { DriverPayoutSummary } from "@/services/delivery/payouts";

export function AdminDriverCompliancePanel({ detail, payouts }: { detail: DriverComplianceDetail; payouts: DriverPayoutSummary }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  async function update(payload: Record<string, string>) {
    setBusy(Object.values(payload)[1] ?? "busy");
    const response = await fetch("/api/admin/drivers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setBusy(null);
    if (response.ok) router.refresh();
  }
  return <div className="space-y-6">
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Required documents</h2><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${detail.readyForApproval ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{detail.readyForApproval ? "Ready for activation" : detail.verificationStatus}</span></div>
      <div className="mt-4 space-y-3">{detail.documents.map((document) => <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-100 p-4"><div><p className="font-semibold">{document.type === "drivers_licence" ? "Driver licence" : "Bank confirmation or statement"}</p><p className="text-sm text-neutral-500">{document.fileName} · <span className="capitalize">{document.status}</span></p></div><div className="flex gap-2">{document.url ? <a href={document.url} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2 text-sm font-semibold">Open</a> : null}<button disabled={busy === document.id} onClick={() => void update({ action: "document_status", documentId: document.id, status: "approved" })} className="rounded-lg bg-neutral-950 px-3 py-2 text-sm font-semibold text-white">Approve</button><button disabled={busy === document.id} onClick={() => void update({ action: "document_status", documentId: document.id, status: "rejected" })} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">Reject</button></div></div>)}</div>
    </section>
    <section className="rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="text-lg font-bold">Payout requests</h2><div className="mt-4 space-y-3">{payouts.requests.length ? payouts.requests.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-100 p-4"><div><p className="font-bold">R {request.amount.toFixed(2)}</p><p className="text-sm capitalize text-neutral-500">{request.status} · {new Date(request.requestedAt).toLocaleDateString("en-ZA")}</p></div>{request.status === "pending" ? <div className="flex gap-2"><button onClick={() => void update({ action: "payout_status", payoutId: request.id, status: "approved" })} className="rounded-lg bg-neutral-950 px-3 py-2 text-sm font-semibold text-white">Approve</button><button onClick={() => void update({ action: "payout_status", payoutId: request.id, status: "rejected" })} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">Reject</button></div> : request.status === "approved" ? <button onClick={() => void update({ action: "payout_status", payoutId: request.id, status: "paid" })} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Mark paid</button> : null}</div>) : <p className="text-sm text-neutral-500">No payout requests yet.</p>}</div></section>
  </div>;
}
