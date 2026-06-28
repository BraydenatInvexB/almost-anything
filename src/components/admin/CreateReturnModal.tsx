"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import type { ReturnMethod, ReturnReasonCode } from "@/lib/admin/operations-types";
import { RETURN_METHODS, RETURN_REASONS } from "@/lib/returns/returns";
import { BtnPrimary } from "@/components/admin/ui";

export function CreateReturnModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    orderNumber: "",
    customerEmail: "",
    customerName: "",
    reasonCode: "other" as ReturnReasonCode,
    reason: "",
    method: "courier_pickup" as ReturnMethod,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not create return");
        return;
      }
      router.refresh();
      onClose();
      if (data.return?.id) {
        router.push(`/admin/returns/${data.return.id}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-950">Create return (RMA)</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Open a return on behalf of a customer using their order number.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <Field label="Order number">
            <input
              className="input w-full"
              value={form.orderNumber}
              onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
              placeholder="AA-83915"
              required
            />
          </Field>
          <Field label="Customer email">
            <input
              type="email"
              className="input w-full"
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              required
            />
          </Field>
          <Field label="Customer name">
            <input
              className="input w-full"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
          </Field>
          <Field label="Reason">
            <select
              className="input w-full"
              value={form.reasonCode}
              onChange={(e) => setForm({ ...form, reasonCode: e.target.value as ReturnReasonCode })}
            >
              {RETURN_REASONS.map((r) => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Details">
            <textarea
              className="input min-h-[80px] w-full"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
            />
          </Field>
          <Field label="Return method">
            <select
              className="input w-full"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value as ReturnMethod })}
            >
              {RETURN_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </Field>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex gap-2 pt-2">
            <BtnPrimary type="submit" disabled={busy} className="flex-1">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create RMA
            </BtnPrimary>
            <button type="button" onClick={onClose} className="btn-secondary h-9 rounded-lg px-4 text-sm font-semibold">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
