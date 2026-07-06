"use client";

import Link from "next/link";
import { MapPin, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AccountSubNav } from "@/components/account/AccountSubNav";
import { useAuth } from "@/context/AuthProvider";
import { useSavedAddresses } from "@/hooks/useSavedAddresses";
import type { CustomerAddress } from "@/types/customer-address";

function formatAddress(address: CustomerAddress): string {
  const lines = [
    address.addressLine1,
    address.addressLine2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
  ].filter(Boolean);
  return lines.join(", ");
}

export default function AddressesPage() {
  const { user, isConfigured } = useAuth();
  const { addresses, loading, error, refresh } = useSavedAddresses(Boolean(user && isConfigured));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (user && isConfigured) void refresh();
  }, [user, isConfigured, refresh]);

  async function setDefault(id: string) {
    setBusyId(id);
    setActionError("");
    try {
      const response = await fetch("/api/account/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "set_default" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update address");
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update address");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    setActionError("");
    try {
      const response = await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not delete address");
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete address");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6">
        <AccountSubNav current="/account/addresses" />
        <h1 className="text-2xl font-bold text-neutral-900">Saved Addresses</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Addresses you save at checkout appear here for faster ordering.
        </p>

        {!user ? (
          <Card variant="elevated" className="mt-8 bg-white p-8 text-center">
            <p className="text-neutral-500">Sign in to manage saved addresses.</p>
            <Link href="/login" className="mt-4 inline-block">
              <Button>Sign In</Button>
            </Link>
          </Card>
        ) : loading ? (
          <p className="mt-8 text-neutral-500">Loading addresses...</p>
        ) : error ? (
          <Card variant="elevated" className="mt-8 bg-white p-8 text-center">
            <p className="font-medium text-red-600">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={() => void refresh()}>
              Try again
            </Button>
          </Card>
        ) : addresses.length === 0 ? (
          <Card variant="elevated" className="mt-8 bg-white p-8 text-center">
            <MapPin className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-4 font-medium text-neutral-900">No saved addresses yet</p>
            <p className="mt-2 text-sm text-neutral-500">
              Check &quot;Save this address for future orders&quot; at checkout to add one.
            </p>
            <Link href="/checkout" className="mt-6 inline-block">
              <Button>Go to checkout</Button>
            </Link>
          </Card>
        ) : (
          <div className="mt-8 space-y-4">
            {actionError ? <p className="text-sm text-red-500">{actionError}</p> : null}
            {addresses.map((address) => (
              <Card key={address.id} variant="elevated" className="bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-neutral-900">{address.fullName}</h2>
                      {address.isDefault ? <Badge>Default</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">{formatAddress(address)}</p>
                    <p className="mt-1 text-sm text-neutral-500">{address.phone}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!address.isDefault ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busyId === address.id}
                        onClick={() => void setDefault(address.id)}
                      >
                        Set default
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      disabled={busyId === address.id}
                      onClick={() => void remove(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
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
