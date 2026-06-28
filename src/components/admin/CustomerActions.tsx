"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, KeyRound, Loader2, MoreHorizontal } from "lucide-react";

const MENU_WIDTH = 208;

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
  const [error, setError] = useState("");
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    function updatePosition() {
      const rect = buttonRef.current!.getBoundingClientRect();
      const left = Math.min(
        Math.max(8, rect.right - MENU_WIDTH),
        window.innerWidth - MENU_WIDTH - 8,
      );
      setMenuPos({ top: rect.bottom + 6, left });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  async function resetPassword() {
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/admin/customers/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not send reset link");
        setState("idle");
        return;
      }
    } catch {
      setError("Network error — try again");
      setState("idle");
      return;
    }
    setState("sent");
    setTimeout(() => {
      setState("idle");
      setOpen(false);
    }, 2000);
  }

  const menu =
    open && mounted
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              aria-hidden
              onClick={() => setOpen(false)}
            />
            <div
              role="menu"
              className="fixed z-50 w-52 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              {error && (
                <p className="mx-1 mb-1 rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</p>
              )}
              <a
                href={`mailto:${email}`}
                role="menuitem"
                className="block rounded-lg px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100"
                onClick={() => setOpen(false)}
              >
                Email customer
              </a>
              {canReset && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={resetPassword}
                  disabled={state !== "idle"}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
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
          </>,
          document.body,
        )
      : null;

  return (
    <div className="flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-800"
        aria-label="Customer actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {menu}
    </div>
  );
}
