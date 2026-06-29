"use client";

import { useState, useEffect } from "react";
import { CheckCircle, LifeBuoy } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { SUPPORT_CATEGORIES } from "@/lib/support/helpdesk";

export function SupportContactForm() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "General",
    subject: "",
    order_id: "",
    body: "",
  });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [ticketNumber, setTicketNumber] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setForm((f) => ({
      ...f,
      name: f.name || user?.user_metadata?.full_name || "",
      email: f.email || user?.email || "",
    }));
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.name,
          customer_email: form.email,
          category: form.category,
          subject: form.subject,
          body: form.body,
          order_id: form.order_id || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTicketNumber(data.ticketNumber);
        setState("sent");
      } else {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error — check your connection and try again.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="mt-3 font-semibold text-neutral-950">Ticket submitted</p>
        <p className="mt-1 text-sm text-neutral-600">
          Reference <strong>{ticketNumber}</strong>. Our support team will reply by email — usually within 4 hours on business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border-2 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10">
          <LifeBuoy className="h-5 w-5 text-brand" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-neutral-950">Open a support ticket</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Goes straight to our helpdesk team — we typically respond within one business day.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-neutral-600">Your name</span>
          <input
            className="input w-full"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-neutral-600">Email</span>
          <input
            className="input w-full"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-neutral-600">Category</span>
          <select
            className="input w-full"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {SUPPORT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-neutral-600">Order number (optional)</span>
          <input
            className="input w-full"
            value={form.order_id}
            onChange={(e) => setForm({ ...form, order_id: e.target.value })}
            placeholder="e.g. AA3915"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-neutral-600">Subject</span>
          <input
            className="input w-full"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-neutral-600">Message</span>
          <textarea
            className="input min-h-[120px] w-full"
            placeholder="Describe your issue in detail — include product names, dates, and anything that helps us resolve it faster."
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            required
          />
        </label>
      </div>

      {state === "error" && errorMsg ? (
        <p className="mt-3 text-sm font-medium text-red-600">{errorMsg}</p>
      ) : null}

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
      >
        {state === "sending" ? "Submitting…" : "Submit ticket"}
      </button>
    </form>
  );
}
