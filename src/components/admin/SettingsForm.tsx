"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { cn } from "@/lib/utils/cn";
import type { PlatformSettings } from "@/types/database";

export function SettingsForm({
  settings,
  canManage,
}: {
  settings: PlatformSettings;
  canManage: boolean;
}) {
  const [form, setForm] = useState(settings);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  function update<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setState("idle");
  }

  async function save() {
    setState("saving");
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: form.store_name,
          support_email: form.support_email,
          default_markup_percent: Number(form.default_markup_percent),
          min_markup_percent: Number(form.min_markup_percent),
          max_markup_percent: Number(form.max_markup_percent),
          free_shipping_threshold: Number(form.free_shipping_threshold),
          flat_shipping_fee: Number(form.flat_shipping_fee),
          tax_rate: Number(form.tax_rate),
          auto_publish_sourced: form.auto_publish_sourced,
          maintenance_mode: form.maintenance_mode,
        }),
      });
    } catch {
      /* demo tolerant */
    }
    setState("saved");
    setTimeout(() => setState("idle"), 2500);
  }

  const disabled = !canManage;

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Storefront">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field label="Store name">
            <input
              disabled={disabled}
              value={form.store_name}
              onChange={(e) => update("store_name", e.target.value)}
              className="input disabled:opacity-60"
            />
          </Field>
          <Field label="Support email">
            <input
              disabled={disabled}
              value={form.support_email}
              onChange={(e) => update("support_email", e.target.value)}
              className="input disabled:opacity-60"
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Pricing & Markup">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <Field label="Default markup %" hint="Applied to every newly sourced product.">
            <input
              type="number"
              disabled={disabled}
              value={form.default_markup_percent}
              onChange={(e) => update("default_markup_percent", Number(e.target.value))}
              className="input disabled:opacity-60"
            />
          </Field>
          <Field label="Minimum markup %">
            <input
              type="number"
              disabled={disabled}
              value={form.min_markup_percent}
              onChange={(e) => update("min_markup_percent", Number(e.target.value))}
              className="input disabled:opacity-60"
            />
          </Field>
          <Field label="Maximum markup %">
            <input
              type="number"
              disabled={disabled}
              value={form.max_markup_percent}
              onChange={(e) => update("max_markup_percent", Number(e.target.value))}
              className="input disabled:opacity-60"
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Shipping & Tax">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <Field label="Free shipping over ($)">
            <input
              type="number"
              disabled={disabled}
              value={form.free_shipping_threshold}
              onChange={(e) => update("free_shipping_threshold", Number(e.target.value))}
              className="input disabled:opacity-60"
            />
          </Field>
          <Field label="Flat shipping fee ($)">
            <input
              type="number"
              disabled={disabled}
              value={form.flat_shipping_fee}
              onChange={(e) => update("flat_shipping_fee", Number(e.target.value))}
              className="input disabled:opacity-60"
            />
          </Field>
          <Field label="Tax rate (0–1)">
            <input
              type="number"
              step="0.01"
              disabled={disabled}
              value={form.tax_rate}
              onChange={(e) => update("tax_rate", Number(e.target.value))}
              className="input disabled:opacity-60"
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Automation">
        <div className="flex flex-col divide-y divide-neutral-100">
          <Toggle
            label="Auto-publish sourced products"
            description="New products found by the sourcing engine go live automatically with the default markup."
            checked={form.auto_publish_sourced}
            disabled={disabled}
            onChange={(v) => update("auto_publish_sourced", v)}
          />
          <Toggle
            label="Maintenance mode"
            description="Temporarily takes the storefront offline for customers."
            checked={form.maintenance_mode}
            disabled={disabled}
            onChange={(v) => update("maintenance_mode", v)}
          />
        </div>
      </Panel>

      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={state === "saving"}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {state === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
            {state === "saved" && <Check className="h-4 w-4" />}
            {state === "saved" ? "Saved" : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
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
      <span className="text-xs font-semibold text-neutral-600">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-neutral-400">{hint}</span>}
    </label>
  );
}

function Toggle({
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
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        <p className="text-xs text-neutral-400">{description}</p>
      </div>
      <button
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
          checked ? "bg-neutral-900" : "bg-neutral-300",
        )}
        aria-pressed={checked}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
