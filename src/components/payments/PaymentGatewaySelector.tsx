"use client";

import { Building2, CreditCard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type PaymentGateway = "payfast" | "ozow";

const GATEWAYS = [
  {
    id: "payfast" as const,
    name: "PayFast",
    description: "Pay securely by card or another supported PayFast method.",
    icon: CreditCard,
  },
  {
    id: "ozow" as const,
    name: "Ozow",
    description: "Pay directly from your bank with secure instant EFT.",
    icon: Building2,
  },
];

export function PaymentGatewaySelector({ value, onChange }: { value: PaymentGateway; onChange: (gateway: PaymentGateway) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-neutral-900">Choose how to pay</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {GATEWAYS.map((gateway) => {
          const Icon = gateway.icon;
          const selected = value === gateway.id;
          return (
            <button
              key={gateway.id}
              type="button"
              onClick={() => onChange(gateway.id)}
              className={cn(
                "relative rounded-2xl border p-4 text-left transition",
                selected ? "border-brand bg-brand/[0.035] ring-1 ring-brand" : "border-neutral-200 bg-white hover:border-neutral-300",
              )}
              aria-pressed={selected}
            >
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", selected ? "bg-brand text-white" : "bg-neutral-100 text-neutral-600")}><Icon className="h-5 w-5" /></span>
              <span className="mt-3 block font-semibold text-neutral-950">{gateway.name}</span>
              <span className="mt-1 block text-xs leading-5 text-neutral-500">{gateway.description}</span>
              {selected ? <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-brand" /> : null}
            </button>
          );
        })}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500"><ShieldCheck className="h-4 w-4 text-emerald-600" />Your payment details are handled securely by the selected provider.</p>
    </fieldset>
  );
}
