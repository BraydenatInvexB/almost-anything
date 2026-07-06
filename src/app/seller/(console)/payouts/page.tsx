"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SellerEmptyState, SellerPanel, SellerPanelBody, SellerPanelHeader } from "@/components/seller/SellerPanel";
import { cn } from "@/lib/utils/cn";

export default function SellerPayoutsPage() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function requestPayout() {
    setLoading(true);
    setMessage("");
    setError(false);
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
      setError(true);
      setMessage(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SellerPanel>
        <SellerPanelHeader
          title="Request payout"
          description="Submit a payout request when you're ready to withdraw earnings. Our team reviews and processes requests."
        />
        <SellerPanelBody>
          <div className="flex max-w-lg flex-col gap-3 sm:flex-row">
            <Input type="number" placeholder="Amount (ZAR)" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Button type="button" isLoading={loading} onClick={() => void requestPayout()}>Request payout</Button>
          </div>
          {message ? <p className={cn("mt-3 text-sm", error ? "text-red-600" : "text-emerald-700")}>{message}</p> : null}
        </SellerPanelBody>
      </SellerPanel>
      <SellerPanel>
        <SellerPanelHeader title="Recent requests" description="Track the status of your withdrawal requests" />
        <SellerPanelBody>
          <SellerEmptyState
            title="No payout history yet"
            description="Payout requests will appear here after your first sale and successful withdrawal."
          />
        </SellerPanelBody>
      </SellerPanel>
    </div>
  );
}
