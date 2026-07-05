import {
  Home,
  Percent,
  Store,
  Truck,
  Zap,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type SettingsTab = "general" | "homepage" | "pricing" | "shipping" | "couriers" | "automation";

export const SETTINGS_TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Store className="h-4 w-4" /> },
  { id: "homepage", label: "Homepage hero", icon: <Home className="h-4 w-4" /> },
  { id: "pricing", label: "Pricing & markup", icon: <Percent className="h-4 w-4" /> },
  { id: "shipping", label: "Shipping & tax", icon: <Truck className="h-4 w-4" /> },
  { id: "couriers", label: "Courier partners", icon: <Globe className="h-4 w-4" /> },
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
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
          checked ? "bg-brand" : "bg-neutral-300",
        )}
        aria-pressed={checked}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
      </button>
    </div>
  );
}
