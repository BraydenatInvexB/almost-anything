"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export function FooterNewsletter() {
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
      <div className="flex items-center gap-2 rounded-xl border-2 border-black bg-brand px-4 py-3 text-sm font-bold text-white">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white/20">
          <Check className="h-3 w-3" />
        </span>
        You&apos;re in. Deals are on the way.
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="Email address"
          className="h-11 w-full rounded-xl border-2 border-black bg-white px-4 text-sm font-medium text-black outline-none placeholder:text-neutral-400 focus:shadow-[3px_3px_0_0_#000]"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-11 w-full rounded-xl border-2 border-black bg-brand text-sm font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-black disabled:opacity-50"
        >
          {status === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
      {status === "error" ? (
        <p className="mt-2 text-xs font-semibold text-brand">Something went wrong. Please try again.</p>
      ) : null}
    </div>
  );
}
