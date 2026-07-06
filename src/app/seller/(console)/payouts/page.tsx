"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function SellerPayoutsPage() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestPayout() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/seller/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setMessage("Payout request submitted for admin review.");
      setAmount("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold">Request payout</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Submit a payout request when you&apos;re ready to withdraw your earnings. Our team reviews and processes requests.
        </p>
        <div className="mt-4 flex max-w-md gap-2">
          <Input type="number" placeholder="Amount (ZAR)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Button type="button" isLoading={loading} onClick={() => void requestPayout()}>Request</Button>
        </div>
        {message ? <p className="mt-3 text-sm text-neutral-600">{message}</p> : null}
      </Card>
      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold">Recent requests</h2>
        <p className="mt-2 text-sm text-neutral-500">Payout history will appear here after your first sale.</p>
      </Card>
    </div>
  );
}
