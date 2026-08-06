"use client";

import { MapPin } from "lucide-react";
import {
  STOCK_LOCATIONS,
  totalLocationStock,
  type ProductLocationInventory,
  type StockLocationCode,
} from "@/lib/product/location-inventory";
import { cn } from "@/lib/utils/cn";

export function ProductLocationInventoryField({
  value,
  onChange,
}: {
  value: ProductLocationInventory;
  onChange: (value: ProductLocationInventory) => void;
}) {
  const total = totalLocationStock(value);

  function setQuantity(code: StockLocationCode, raw: string) {
    const parsed = Number(raw);
    const quantity = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
    onChange({ ...value, [code]: quantity });
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-950">Stock locations</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-500">
            Enter the physical units held at each fulfilment hub. A location only appears to shoppers when its quantity is above zero.
          </p>
        </div>
        <span className="rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white">
          {total} total {total === 1 ? "unit" : "units"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {STOCK_LOCATIONS.map((location) => {
          const active = value[location.code] > 0;
          return (
            <div
              key={location.code}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                active ? "border-brand/35 bg-brand/[0.035]" : "border-neutral-200 bg-neutral-50/70",
              )}
            >
              <div className="flex items-start gap-3">
                <span className={cn("grid h-9 w-9 place-items-center rounded-full", active ? "bg-brand text-white" : "bg-white text-neutral-500")}>
                  <MapPin className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-950">{location.city}</p>
                  <p className="text-[11px] text-neutral-500">{location.shortLabel} · {location.province}</p>
                </div>
              </div>
              <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                Units at this hub
                <input
                  className="input mt-1.5"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={value[location.code]}
                  onChange={(event) => setQuantity(location.code, event.target.value)}
                  aria-label={`${location.city} stock quantity`}
                />
              </label>
              <p className={cn("mt-2 text-xs font-medium", active ? "text-emerald-700" : "text-neutral-400")}>
                {active ? `Shown as in stock in ${location.shortLabel}` : "Not shown as available"}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
