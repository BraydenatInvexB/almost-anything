"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, Banknote, Clock3, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PaymentGatewayFeesNotice } from "@/components/seller/PaymentGatewayFeesNotice";
import { SellerEmptyState, SellerPanel, SellerPanelBody, SellerPanelHeader } from "@/components/seller/SellerPanel";
import { formatCurrency } from "@/lib/utils/cn";
import { cn } from "@/lib/utils/cn";
import type { SellerPayoutSummary } from "@/services/seller/payouts";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-blue-50 text-blue-700",
  paid: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

export function SellerPayoutDesk({ summary }: { summary: SellerPayoutSummary }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const parsedAmount = Number(amount);
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
      router.refresh();
    } catch (err) {
      setError(true);
      setMessage(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total earned", value: summary.grossEarnings, note: "Gross product sales", icon: Banknote },
          { label: "Available to withdraw", value: summary.availableAmount, note: "Ready to request", icon: WalletCards, featured: true },
          { label: "Requested", value: summary.requestedAmount, note: "Includes pending and paid", icon: Clock3 },
          { label: "Paid out", value: summary.paidAmount, note: "Sent to your bank", icon: ArrowDownToLine },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={cn("rounded-2xl border p-4", item.featured ? "border-brand/20 bg-brand/[0.035]" : "border-neutral-200 bg-white")}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-neutral-500">{item.label}</p>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", item.featured ? "bg-brand text-white" : "bg-neutral-100 text-neutral-600")}><Icon className="h-4 w-4" /></span>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">{formatCurrency(item.value, "ZAR")}</p>
              <p className="mt-1 text-xs text-neutral-500">{item.note}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm">
        {summary.vatRegistered ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-neutral-900">VAT included in your sales</p>
              <p className="mt-1 text-xs text-neutral-500">Your gross sales include VAT at 15%. Keep this amount available for your VAT return.</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-neutral-950">{formatCurrency(summary.vatIncluded, "ZAR")}</p>
              <p className="text-xs text-neutral-500">Sales excluding VAT: {formatCurrency(summary.netSalesExcludingVat, "ZAR")}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs leading-5 text-neutral-600"><strong className="text-neutral-900">Not marked as VAT registered.</strong> VAT is not separated from your seller earnings. Add a valid VAT number in seller settings if your business is registered for VAT.</p>
        )}
      </div>

      <PaymentGatewayFeesNotice showLegal />

      <SellerPanel>
        <SellerPanelHeader
          title="Request payout"
          description={`Choose any amount up to ${formatCurrency(summary.availableAmount, "ZAR")} and send it to your linked bank account.`}
        />
        <SellerPanelBody>
          <div className="flex max-w-lg flex-col gap-3 sm:flex-row">
            <Input
              type="number"
              min="0"
              max={summary.availableAmount}
              placeholder="Amount (ZAR)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              type="button"
              isLoading={loading}
              disabled={!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > summary.availableAmount}
              onClick={() => void requestPayout()}
            >
              Request payout
            </Button>
          </div>
          {summary.availableAmount > 0 ? (
            <button type="button" onClick={() => setAmount(String(summary.availableAmount))} className="mt-2 text-xs font-semibold text-brand hover:underline">
              Request the full available amount
            </button>
          ) : (
            <p className="mt-2 text-xs text-neutral-500">Your available balance will increase after customers purchase your products.</p>
          )}

          {message ? (
            <p className={cn("mt-3 text-sm", error ? "text-red-600" : "text-emerald-700")}>{message}</p>
          ) : null}
        </SellerPanelBody>
      </SellerPanel>

      <SellerPanel>
        <SellerPanelHeader title="Recent requests" description="Track the status of your withdrawal requests" />
        <SellerPanelBody>
          {summary.payouts.length ? (
            <div className="divide-y divide-neutral-100">
              {summary.payouts.map((payout) => (
                <div key={payout.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-neutral-900">{formatCurrency(payout.amount, payout.currency)}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">Requested {new Date(payout.requestedAt).toLocaleDateString("en-ZA")}</p>
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", STATUS_STYLES[payout.status])}>{payout.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <SellerEmptyState
              title="No payout history yet"
              description="Your payout requests will appear here."
            />
          )}
        </SellerPanelBody>
      </SellerPanel>
    </div>
  );
}
