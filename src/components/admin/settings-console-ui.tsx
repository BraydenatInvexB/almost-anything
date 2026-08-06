import {
  Percent,
  Store,
  Truck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type SettingsTab = "general" | "pricing" | "shipping" | "automation";

export const SETTINGS_TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Store className="h-4 w-4" /> },
  { id: "pricing", label: "Pricing & markup", icon: <Percent className="h-4 w-4" /> },
  { id: "shipping", label: "Shipping & tax", icon: <Truck className="h-4 w-4" /> },
  { id: "automation", label: "Automation", icon: <Zap className="h-4 w-4" /> },
];

export function SettingsConsoleField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
      {children}
      {hint && <span className="text-[11px] leading-relaxed text-neutral-400">{hint}</span>}
    </label>
  );
}

export function SettingsConsoleToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-100 px-5 py-4 last:border-0">
      <div>
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "border-brand bg-brand" : "border-neutral-300 bg-neutral-200",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-1 top-1 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}
