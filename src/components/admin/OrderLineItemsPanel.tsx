"use client";

import Image from "next/image";
import type { AdminOrderLineItem } from "@/services/admin-service";
import { formatLineItemOptions } from "@/lib/orders/line-items";
import { formatCurrency } from "@/lib/utils/cn";

export function OrderLineItemsPanel({
  items,
  currency,
}: {
  items: AdminOrderLineItem[];
  currency: string;
}) {
  return (
    <ul className="divide-y divide-neutral-100">
      {items.map((item) => {
        const options = formatLineItemOptions(item);
        return (
          <li key={item.id} className="px-5 py-5">
            <div className="flex gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl">📦</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-neutral-950">{item.name}</p>
                {item.sku && (
                  <p className="mt-0.5 font-mono text-xs text-neutral-400">SKU {item.sku}</p>
                )}
                {options.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {options.map((opt) => (
                      <span
                        key={opt}
                        className="inline-flex rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand"
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-sm text-neutral-500">Quantity: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold tabular-nums text-neutral-950">
                  {formatCurrency(item.unitPrice * item.quantity, currency)}
                </p>
                <p className="text-xs text-neutral-400">
                  {formatCurrency(item.unitPrice, currency)} each
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
