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
      <div className="flex items-center gap-2 rounded-xl border-2 border-black bg-[#CDFF00] px-4 py-3 text-sm font-bold text-black">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-white text-black">
          <Check className="h-3 w-3" />
        </span>
        You&apos;re in. Deals are on the way.
      </div>
    );
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-xl border-2 border-black bg-white p-1.5 pl-4 transition-all focus-within:-translate-x-0.5 focus-within:-translate-y-0.5 focus-within:shadow-[3px_3px_0_0_#000]"
      >
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="Email address"
          className="h-9 min-w-0 flex-1 bg-transparent text-sm font-medium text-black outline-none placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-9 shrink-0 rounded-lg border-2 border-black bg-black px-5 text-xs font-extrabold uppercase text-white transition-colors hover:bg-[#CDFF00] hover:text-black disabled:opacity-50"
        >
          {status === "loading" ? "..." : "Subscribe"}
        </button>
      </form>
      {status === "error" ? (
        <p className="mt-2 text-xs font-semibold text-[#FF6B57]">Something went wrong. Please try again.</p>
      ) : null}
    </div>
  );
}
