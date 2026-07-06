"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PaymentGatewayFeesNotice } from "@/components/seller/PaymentGatewayFeesNotice";
import { SellerEmptyState, SellerPanel, SellerPanelBody, SellerPanelHeader } from "@/components/seller/SellerPanel";
import { estimateGatewayFee } from "@/config/payment-gateway-fees";
import { formatCurrency } from "@/lib/utils/cn";
import { cn } from "@/lib/utils/cn";

export function SellerPayoutDesk() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const parsedAmount = Number(amount);
  const feePreview = useMemo(() => {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return null;
    const localFee = estimateGatewayFee(parsedAmount, false);
    const intlFee = estimateGatewayFee(parsedAmount, true);
    return {
      localFee,
      intlFee,
      localNet: Math.max(0, parsedAmount - localFee),
      intlNet: Math.max(0, parsedAmount - intlFee),
    };
  }, [parsedAmount]);

  async function requestPayout() {
    setLoading(true);
    setMessage("");
    setError(false);
    try {
      const res = await fetch("/api/seller/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount }),
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
      <PaymentGatewayFeesNotice showLegal />

      <SellerPanel>
        <SellerPanelHeader
          title="Request payout"
          description="Withdraw earnings to your linked bank account. Paystack deducts card processing fees before funds settle — see rates above."
        />
        <SellerPanelBody>
          <div className="flex max-w-lg flex-col gap-3 sm:flex-row">
            <Input
              type="number"
              placeholder="Amount (ZAR)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              type="button"
              isLoading={loading}
              disabled={!Number.isFinite(parsedAmount) || parsedAmount <= 0}
              onClick={() => void requestPayout()}
            >
              Request payout
            </Button>
          </div>

          {feePreview ? (
            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
              <p className="font-semibold text-neutral-800">Estimated after Paystack fees</p>
              <p className="mt-1">
                Local card: {formatCurrency(feePreview.localNet, "ZAR")} net (
                {formatCurrency(feePreview.localFee, "ZAR")} fee)
              </p>
              <p>
                International card: {formatCurrency(feePreview.intlNet, "ZAR")} net (
                {formatCurrency(feePreview.intlFee, "ZAR")} fee)
              </p>
            </div>
          ) : null}

          {message ? (
            <p className={cn("mt-3 text-sm", error ? "text-red-600" : "text-emerald-700")}>{message}</p>
          ) : null}
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
