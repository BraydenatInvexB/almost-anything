"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { usePromo } from "@/context/PromoProvider";
import { formatCurrency } from "@/lib/utils/cn";

export function PromoCodeInput({ currency = "ZAR" }: { currency?: string }) {
  const { applied, loading, error, applyCode, clearPromo } = usePromo();
  const [code, setCode] = useState("");

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    const ok = await applyCode(code);
    if (ok) setCode("");
  }

  return (
    <div className="space-y-3">
      {applied ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
          <div className="flex items-center gap-2 text-emerald-800">
            <Tag className="h-4 w-4" />
            <span>
              <strong>{applied.code}</strong> applied ·{" "}
              {formatCurrency(applied.discountAmount, currency)} off
            </span>
          </div>
          <button
            type="button"
            onClick={clearPromo}
            className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
            aria-label="Remove promo code"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="flex gap-2">
          <Input
            placeholder="Promo code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="rounded-2xl"
          />
          <Button type="submit" variant="secondary" isLoading={loading} className="shrink-0 rounded-full">
            Apply
          </Button>
        </form>
      )}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
