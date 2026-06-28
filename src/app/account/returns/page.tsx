"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AccountSubNav } from "@/components/account/AccountSubNav";
import { ReturnRequestForm } from "@/components/returns/ReturnRequestForm";
import { useAuth } from "@/context/AuthProvider";
import type { ReturnRequest } from "@/lib/admin/operations-types";
import { returnReasonLabel, returnStatusLabel } from "@/lib/returns/returns";
import { formatCurrency } from "@/lib/utils/cn";
import type { Order } from "@/types/cart";

const STATUS_BADGE: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  received: "bg-violet-100 text-violet-800",
  refunded: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AccountReturnsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-neutral-500">Loading…</p>}>
      <AccountReturnsInner />
    </Suspense>
  );
}

function AccountReturnsInner() {
  const searchParams = useSearchParams();
  const startOpen = searchParams.get("start") === "1";
  const prefilledOrder = searchParams.get("order") ?? "";
  const { user, isConfigured } = useAuth();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [fetched, setFetched] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [showForm, setShowForm] = useState(startOpen || Boolean(prefilledOrder));
  const [orderForForm, setOrderForForm] = useState<Order | null>(null);

  useEffect(() => {
    if (!user || !isConfigured) {
      setFetched(true);
      return;
    }
    fetch("/api/returns")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Could not load returns");
        setReturns(data.returns ?? []);
      })
      .catch((err: Error) => {
        setFetchError(err.message || "Could not load returns. Please try again.");
        setReturns([]);
      })
      .finally(() => setFetched(true));
  }, [user, isConfigured]);

  useEffect(() => {
    if (!prefilledOrder || !user) return;
    fetch(`/api/orders?orderNumber=${encodeURIComponent(prefilledOrder)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.order) setOrderForForm(data.order);
      })
      .catch(() => setOrderForForm(null));
  }, [prefilledOrder, user]);

  function refreshReturns() {
    fetch("/api/returns")
      .then((r) => r.json())
      .then((data) => setReturns(data.returns ?? []));
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6">
        <AccountSubNav current="/account/returns" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Returns</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Track return requests and submit new ones within 30 days of delivery.
            </p>
          </div>
          {user && (
            <Button onClick={() => setShowForm((v) => !v)} variant="secondary" className="rounded-full">
              {showForm ? "Hide form" : "Start a return"}
            </Button>
          )}
        </div>

        {!user ? (
          <Card variant="elevated" className="mt-8 bg-white p-8 text-center">
            <RotateCcw className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-4 font-medium">Sign in to view your returns</p>
            <p className="mt-2 text-sm text-neutral-500">
              Or start a return with your order number on our{" "}
              <Link href="/help/returns" className="text-brand hover:underline">
                returns help page
              </Link>
              .
            </p>
            <Link href="/login" className="mt-6 inline-block">
              <Button>Sign In</Button>
            </Link>
          </Card>
        ) : (
          <>
            {showForm && (
              <div className="mt-8 max-w-xl">
                <ReturnRequestForm
                  order={
                    user.email
                      ? {
                          orderNumber: prefilledOrder || orderForForm?.orderNumber || "",
                          customerEmail: user.email,
                          customerName: (user.user_metadata?.full_name as string) ?? undefined,
                          items: (orderForForm?.items ?? []).map((i) => ({
                            id: i.id,
                            name: i.name,
                            quantity: i.quantity,
                            price: i.price,
                          })),
                        }
                      : undefined
                  }
                  onSuccess={() => {
                    setShowForm(false);
                    refreshReturns();
                  }}
                />
              </div>
            )}

            {!fetched ? (
              <p className="mt-8 text-neutral-500">Loading returns…</p>
            ) : fetchError ? (
              <Card variant="elevated" className="mt-8 bg-white p-8 text-center">
                <p className="font-medium text-red-600">{fetchError}</p>
                <Button variant="secondary" className="mt-4" onClick={() => {
                  setFetched(false);
                  setFetchError("");
                  fetch("/api/returns")
                    .then(async (r) => {
                      const data = await r.json();
                      if (!r.ok) throw new Error(data.error ?? "Could not load returns");
                      setReturns(data.returns ?? []);
                    })
                    .catch((err: Error) => setFetchError(err.message))
                    .finally(() => setFetched(true));
                }}>
                  Try again
                </Button>
              </Card>
            ) : returns.length === 0 ? (
              <Card variant="elevated" className="mt-8 bg-white py-16 text-center">
                <RotateCcw className="mx-auto h-12 w-12 text-neutral-300" />
                <p className="mt-4 font-medium">No returns yet</p>
                <p className="mt-2 text-sm text-neutral-500">
                  Start a return from an eligible order, or use the button above.
                </p>
                <Link href="/account/orders" className="mt-6 inline-block">
                  <Button variant="secondary">View orders</Button>
                </Link>
              </Card>
            ) : (
              <div className="mt-8 space-y-4">
                {returns.map((r) => (
                  <Card key={r.id} variant="elevated" className="bg-white p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-semibold">{r.rmaNumber}</p>
                        <p className="mt-1 text-sm text-neutral-500">
                          Order {r.orderNumber} · {returnReasonLabel(r.reasonCode)}
                        </p>
                      </div>
                      <Badge className={STATUS_BADGE[r.status] ?? "bg-neutral-100 text-neutral-700"}>
                        {returnStatusLabel(r.status)}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-neutral-600">{r.reason}</p>
                    <ul className="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-sm text-neutral-600">
                      {r.items.map((item) => (
                        <li key={item.orderItemId}>
                          {item.name} × {item.returnQuantity}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-4 text-sm">
                      <span className="text-neutral-500">
                        Submitted {new Date(r.createdAt).toLocaleDateString("en-ZA")}
                      </span>
                      {r.refundAmount > 0 && (
                        <span className="font-semibold">
                          Refund {formatCurrency(r.refundAmount, r.currency)}
                        </span>
                      )}
                    </div>
                    {r.status === "approved" && (
                      <p className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
                        Your return is approved. Check your email for the prepaid shipping label.
                      </p>
                    )}
                    {r.status === "rejected" && r.rejectionReason && (
                      <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        {r.rejectionReason}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
