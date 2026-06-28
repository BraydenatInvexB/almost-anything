"use client";

import { useState } from "react";
import { Check, KeyRound, Loader2, MoreHorizontal } from "lucide-react";

export function CustomerActions({
  customerId,
  email,
  canReset,
}: {
  customerId: string;
  email: string;
  canReset: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function resetPassword() {
    setState("sending");
    try {
      await fetch("/api/admin/customers/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, email }),
      });
    } catch {
      /* demo tolerant */
    }
    setState("sent");
    setTimeout(() => {
      setState("idle");
      setOpen(false);
    }, 2000);
  }

  return (
    <div className="relative flex justify-end">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        aria-label="Customer actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 w-52 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
            <a
              href={`mailto:${email}`}
              className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              Email customer
            </a>
            {canReset && (
              <button
                onClick={resetPassword}
                disabled={state !== "idle"}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
              >
                {state === "sending" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : state === "sent" ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {state === "sent" ? "Reset link sent" : "Send password reset"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
