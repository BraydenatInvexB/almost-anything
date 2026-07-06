"use client";

import { CreditCard } from "lucide-react";
import type { CustomerPaymentMethod } from "@/types/customer-payment-method";

function cardLabel(method: CustomerPaymentMethod): string {
  const brand = method.cardType ?? "Card";
  const expiry =
    method.expMonth && method.expYear ? ` · ${method.expMonth}/${method.expYear}` : "";
  return `${brand} •••• ${method.last4}${expiry}`;
}

export function SavedCardPicker({
  methods,
  selectedId,
  onSelect,
}: {
  methods: CustomerPaymentMethod[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (methods.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-neutral-900">Saved cards</p>
      {methods.map((method) => (
        <label
          key={method.id}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 text-sm ${
            selectedId === method.id ? "border-brand bg-brand/5" : "border-neutral-200"
          }`}
        >
          <input
            type="radio"
            name="savedCard"
            checked={selectedId === method.id}
            onChange={() => onSelect(method.id)}
          />
          <CreditCard className="h-4 w-4 shrink-0 text-neutral-500" />
          <span className="font-medium">{cardLabel(method)}</span>
          {method.isDefault ? (
            <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
              Default
            </span>
          ) : null}
        </label>
      ))}
      <label
        className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 text-sm ${
          selectedId === null ? "border-brand bg-brand/5" : "border-neutral-200"
        }`}
      >
        <input
          type="radio"
          name="savedCard"
          checked={selectedId === null}
          onChange={() => onSelect(null)}
        />
        <span className="font-medium">Use a new card</span>
      </label>
    </div>
  );
}
