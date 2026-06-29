"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export function FooterNewsletter({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className={
          variant === "dark"
            ? "flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
            : "flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        }
      >
        <Check className="h-4 w-4 shrink-0" />
        You&apos;re subscribed. Watch your inbox for deals.
      </div>
    );
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="Email address"
          className={
            variant === "dark"
              ? "h-10 min-w-0 flex-1 rounded-md border border-white/20 bg-white/5 px-3.5 text-sm text-white shadow-sm outline-none placeholder:text-neutral-500 focus:border-white/40 focus:ring-2 focus:ring-white/10"
              : "h-10 min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          }
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-10 shrink-0 rounded-md bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
        >
          {status === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
      {status === "error" ? (
        <p className={`mt-2 text-xs ${variant === "dark" ? "text-red-400" : "text-red-600"}`}>Something went wrong. Please try again.</p>
      ) : null}
    </div>
  );
}
