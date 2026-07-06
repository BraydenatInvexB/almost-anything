"use client";

import { useState } from "react";
import { Warehouse } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { BtnPrimary } from "@/components/admin/ui";
import { SellerStockOriginField } from "@/components/seller/SellerStockOriginField";
import type { StockOrigin } from "@/lib/admin/operations-inventory-types";

export function SellerStockDefaultsPanel({
  defaultStockOrigin: initialOrigin,
}: {
  defaultStockOrigin: StockOrigin;
}) {
  const [defaultStockOrigin, setDefaultStockOrigin] = useState(initialOrigin);
  const [savedOrigin, setSavedOrigin] = useState(initialOrigin);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dirty = defaultStockOrigin !== savedOrigin;

  async function save() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/seller/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultStockOrigin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save settings");
      const next = data.defaultStockOrigin as StockOrigin;
      setDefaultStockOrigin(next);
      setSavedOrigin(next);
      setMessage("Default warehouse saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card variant="elevated" className="p-6">
      <div className="flex items-start gap-3">
        <Warehouse className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Stock import defaults</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Choose the warehouse shown on new products. CSV imports use this when a row has no warehouse column.
          </p>
          <div className="mt-4 max-w-md">
            <SellerStockOriginField
              value={defaultStockOrigin}
              onChange={setDefaultStockOrigin}
              hint="Applies to manual add and bulk stock list imports unless you pick a different warehouse per product."
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <BtnPrimary type="button" disabled={loading || !dirty} onClick={() => void save()}>
              {loading ? "Saving…" : "Save default"}
            </BtnPrimary>
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
