"use client";

import Link from "next/link";
import { CreditCard, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AccountSubNav } from "@/components/account/AccountSubNav";
import { useAuth } from "@/context/AuthProvider";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

function cardLabel(type: string | null, last4: string): string {
  return `${type ?? "Card"} •••• ${last4}`;
}

export default function PaymentMethodsPage() {
  const { user, isConfigured } = useAuth();
  const { methods, loading, error, refresh } = usePaymentMethods(Boolean(user && isConfigured));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (user && isConfigured) void refresh();
  }, [user, isConfigured, refresh]);

  async function remove(id: string) {
    setBusyId(id);
    setActionError("");
    try {
      const response = await fetch(`/api/account/payment-methods?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not remove card");
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not remove card");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6">
        <AccountSubNav current="/account/payment-methods" />
        <h1 className="text-2xl font-bold text-neutral-900">Saved payment methods</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Cards saved at checkout appear here for faster payments.
        </p>

        {!user ? (
          <Card variant="elevated" className="mt-8 bg-white p-8 text-center">
            <p className="text-neutral-500">Sign in to manage saved cards.</p>
            <Link href="/login" className="mt-4 inline-block">
              <Button>Sign In</Button>
            </Link>
          </Card>
        ) : loading ? (
          <p className="mt-8 text-neutral-500">Loading saved cards…</p>
        ) : error ? (
          <Card variant="elevated" className="mt-8 bg-white p-8 text-center">
            <p className="font-medium text-red-600">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={() => void refresh()}>
              Try again
            </Button>
          </Card>
        ) : methods.length === 0 ? (
          <Card variant="elevated" className="mt-8 bg-white p-8 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-4 font-medium text-neutral-900">No saved cards yet</p>
            <p className="mt-2 text-sm text-neutral-500">
              Check &quot;Save this card for future orders&quot; when paying at checkout.
            </p>
            <Link href="/checkout" className="mt-6 inline-block">
              <Button>Go to checkout</Button>
            </Link>
          </Card>
        ) : (
          <div className="mt-8 space-y-4">
            {actionError ? <p className="text-sm text-red-500">{actionError}</p> : null}
            {methods.map((method) => (
              <Card key={method.id} variant="elevated" className="bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-neutral-500" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-neutral-900">
                          {cardLabel(method.cardType, method.last4)}
                        </h2>
                        {method.isDefault ? <Badge>Default</Badge> : null}
                      </div>
                      {method.expMonth && method.expYear ? (
                        <p className="text-sm text-neutral-500">
                          Expires {method.expMonth}/{method.expYear}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    disabled={busyId === method.id}
                    onClick={() => void remove(method.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
