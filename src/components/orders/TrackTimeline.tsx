import { Check, Package, CreditCard, Box, Truck, Home } from "lucide-react";
import type { OrderStatus } from "@/types/cart";
import { TRACK_STEPS, customerStatus } from "@/lib/orders/status";

const STEP_ICONS = [Package, CreditCard, Box, Truck, Home];

export function TrackTimeline({ status }: { status: OrderStatus }) {
  const { step, label } = customerStatus(status);
  const cancelled = step < 0;

  if (cancelled) {
    return (
      <div className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">
        This order was cancelled. If you believe this is a mistake, please contact
        support.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-6 text-sm text-neutral-500">
        Current status:{" "}
        <span className="font-semibold text-neutral-900">{label}</span>
      </p>

      {/* Desktop: horizontal stepper */}
      <ol className="hidden items-start sm:flex">
        {TRACK_STEPS.map((s, i) => {
          const Icon = STEP_ICONS[i];
          const done = i < step;
          const active = i === step;
          return (
            <li key={s} className="relative flex flex-1 flex-col items-center text-center">
              {i < TRACK_STEPS.length - 1 && (
                <span
                  className={`absolute left-1/2 top-5 h-0.5 w-full ${
                    i < step ? "bg-[#CDFF00]" : "bg-neutral-200"
                  }`}
                />
              )}
              <span
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  done
                    ? "border-[#CDFF00] bg-[#CDFF00] text-neutral-900"
                    : active
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white text-neutral-300"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span
                className={`mt-2 text-xs font-medium ${
                  i <= step ? "text-neutral-900" : "text-neutral-400"
                }`}
              >
                {s}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Mobile: vertical stepper */}
      <ol className="flex flex-col gap-0 sm:hidden">
        {TRACK_STEPS.map((s, i) => {
          const Icon = STEP_ICONS[i];
          const done = i < step;
          const active = i === step;
          return (
            <li key={s} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                    done
                      ? "border-[#CDFF00] bg-[#CDFF00] text-neutral-900"
                      : active
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-white text-neutral-300"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                {i < TRACK_STEPS.length - 1 && (
                  <span className={`my-1 h-8 w-0.5 ${i < step ? "bg-[#CDFF00]" : "bg-neutral-200"}`} />
                )}
              </div>
              <span className={`pt-2 text-sm font-medium ${i <= step ? "text-neutral-900" : "text-neutral-400"}`}>
                {s}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
