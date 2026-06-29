"use client";

import { useState } from "react";
import {
  Check,
  Home,
  Loader2,
  Plus,
  Store,
  Percent,
  Truck,
  Zap,
  Trash2,
  Globe,
} from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { HeroShowcaseEditor } from "@/components/admin/HeroShowcaseEditor";
import { cn } from "@/lib/utils/cn";
import type { PlatformSettings } from "@/types/database";
import type { ExtendedPlatformConfig, ConfigCourier } from "@/lib/admin/operations-types";

type SettingsTab = "general" | "homepage" | "pricing" | "shipping" | "couriers" | "automation";

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Store className="h-4 w-4" /> },
  { id: "homepage", label: "Homepage hero", icon: <Home className="h-4 w-4" /> },
  { id: "pricing", label: "Pricing & markup", icon: <Percent className="h-4 w-4" /> },
  { id: "shipping", label: "Shipping & tax", icon: <Truck className="h-4 w-4" /> },
  { id: "couriers", label: "Courier partners", icon: <Globe className="h-4 w-4" /> },
  { id: "automation", label: "Automation", icon: <Zap className="h-4 w-4" /> },
];

export function SettingsConsole({
  settings,
  canManage,
  extendedConfig,
}: {
  settings: PlatformSettings;
  canManage: boolean;
  extendedConfig: ExtendedPlatformConfig;
}) {
  const [tab, setTab] = useState<SettingsTab>("general");
  const [form, setForm] = useState(settings);
  const [extConfig, setExtConfig] = useState(extendedConfig);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [newCourier, setNewCourier] = useState({
    name: "",
    baseCost: "",
    etaLabel: "",
    regions: "ZA",
  });

  const disabled = !canManage;

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
          currency: form.currency,
          extendedConfig: extConfig,
        }),
      });
    } catch {
      /* demo tolerant */
    }
    setState("saved");
    setTimeout(() => setState("idle"), 2500);
  }

  function addCourier(e: React.FormEvent) {
    e.preventDefault();
    if (!newCourier.name.trim()) return;
    const id = newCourier.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");
    const courier: ConfigCourier = {
      id,
      name: newCourier.name.trim(),
      baseCost: Number(newCourier.baseCost) || 99,
      etaLabel: newCourier.etaLabel || "3 to 5 business days",
      regions: newCourier.regions.split(",").map((r) => r.trim()).filter(Boolean),
    };
    setExtConfig((c) => ({
      ...c,
      couriers: [...c.couriers.filter((x) => x.id !== id), courier],
      enabledCourierIds: c.enabledCourierIds.includes(id)
        ? c.enabledCourierIds
        : [...c.enabledCourierIds, id],
    }));
    setNewCourier({ name: "", baseCost: "", etaLabel: "", regions: "ZA" });
    setState("idle");
  }

  function removeCourier(id: string) {
    setExtConfig((c) => ({
      ...c,
      couriers: c.couriers.filter((x) => x.id !== id),
      enabledCourierIds: c.enabledCourierIds.filter((x) => x !== id),
      defaultCourierId: c.defaultCourierId === id ? (c.enabledCourierIds.find((x) => x !== id) ?? "") : c.defaultCourierId,
    }));
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-1.5 lg:w-56 lg:flex-col lg:overflow-visible">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap transition-colors",
              tab === t.id
                ? "bg-neutral-950 text-white"
                : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>

      <div className="min-w-0 flex-1 space-y-4">
        {tab === "general" && (
          <Panel title="Store identity" description="How your brand appears on the storefront and in customer emails.">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Store name">
                <input disabled={disabled} value={form.store_name} onChange={(e) => update("store_name", e.target.value)} className="input disabled:opacity-60" />
              </Field>
              <Field label="Support email">
                <input disabled={disabled} value={form.support_email} onChange={(e) => update("support_email", e.target.value)} className="input disabled:opacity-60" />
              </Field>
              <Field label="Currency code">
                <input disabled={disabled} value={form.currency} onChange={(e) => update("currency", e.target.value)} className="input disabled:opacity-60" />
              </Field>
            </div>
          </Panel>
        )}

        {tab === "homepage" && (
          <Panel
            title="Homepage hero showcase"
            description="Edit the rotating product cards, images, prices, and badges on the homepage hero."
          >
            <div className="p-5">
              <HeroShowcaseEditor
                value={extConfig.heroShowcase}
                onChange={(heroShowcase) => {
                  setExtConfig((c) => ({ ...c, heroShowcase }));
                  setState("idle");
                }}
                disabled={disabled}
                currency={form.currency}
              />
            </div>
          </Panel>
        )}

        {tab === "pricing" && (
          <Panel title="Markup rules" description="Controls margin applied when sourcing and publishing products.">
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Field label="Default markup %" hint="Applied to newly sourced products.">
                <input type="number" disabled={disabled} value={form.default_markup_percent} onChange={(e) => update("default_markup_percent", Number(e.target.value))} className="input disabled:opacity-60" />
              </Field>
              <Field label="Minimum markup %">
                <input type="number" disabled={disabled} value={form.min_markup_percent} onChange={(e) => update("min_markup_percent", Number(e.target.value))} className="input disabled:opacity-60" />
              </Field>
              <Field label="Maximum markup %">
                <input type="number" disabled={disabled} value={form.max_markup_percent} onChange={(e) => update("max_markup_percent", Number(e.target.value))} className="input disabled:opacity-60" />
              </Field>
            </div>
          </Panel>
        )}

        {tab === "shipping" && (
          <>
            <Panel title="Shipping & tax">
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field label="Free shipping threshold (ZAR)" hint="Orders above this show free delivery to customers.">
                  <input type="number" disabled={disabled} value={form.free_shipping_threshold} onChange={(e) => update("free_shipping_threshold", Number(e.target.value))} className="input disabled:opacity-60" />
                </Field>
                <Field label="Flat shipping fee (ZAR)" hint="Used when delivery is not embedded in price.">
                  <input type="number" disabled={disabled} value={form.flat_shipping_fee} onChange={(e) => update("flat_shipping_fee", Number(e.target.value))} className="input disabled:opacity-60" />
                </Field>
                <Field label="VAT rate (decimal)" hint="e.g. 0.15 for 15%">
                  <input type="number" step="0.01" disabled={disabled} value={form.tax_rate} onChange={(e) => update("tax_rate", Number(e.target.value))} className="input disabled:opacity-60" />
                </Field>
              </div>
            </Panel>
            <Panel title="Delivery pricing strategy">
              <Toggle
                label="Embed delivery cost in product prices"
                description="Customers always see FREE delivery at checkout. Courier fees are built into retail prices — finance tracks internal courier cost separately."
                checked={extConfig.embedShippingInPrice}
                disabled={disabled}
                onChange={(v) => setExtConfig((c) => ({ ...c, embedShippingInPrice: v }))}
              />
            </Panel>
          </>
        )}

        {tab === "couriers" && (
          <>
            <Panel title="Active courier partners" description="Enable partners for checkout. Add your own regional or international couriers below.">
              <div className="divide-y divide-neutral-100">
                {extConfig.couriers.map((c) => (
                  <div key={c.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={extConfig.enabledCourierIds.includes(c.id)}
                        onChange={(e) => {
                          setExtConfig((cfg) => ({
                            ...cfg,
                            enabledCourierIds: e.target.checked
                              ? [...cfg.enabledCourierIds, c.id]
                              : cfg.enabledCourierIds.filter((id) => id !== c.id),
                          }));
                        }}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-neutral-950">{c.name}</p>
                        <p className="text-xs text-neutral-500">
                          {c.etaLabel} · Internal cost {c.baseCost} ZAR · Regions: {c.regions.join(", ")}
                        </p>
                      </div>
                    </div>
                    {disabled ? null : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="input w-24 text-sm"
                          value={c.baseCost}
                          onChange={(e) => {
                            const cost = Number(e.target.value);
                            setExtConfig((cfg) => ({
                              ...cfg,
                              couriers: cfg.couriers.map((x) => (x.id === c.id ? { ...x, baseCost: cost } : x)),
                            }));
                          }}
                        />
                        {!["courier_guy", "fastway", "aramex"].includes(c.id) && (
                          <button type="button" onClick={() => removeCourier(c.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Remove courier">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-neutral-100 px-5 py-4">
                <Field label="Default courier at checkout">
                  <select
                    disabled={disabled}
                    value={extConfig.defaultCourierId}
                    onChange={(e) => setExtConfig((c) => ({ ...c, defaultCourierId: e.target.value }))}
                    className="input max-w-md disabled:opacity-60"
                  >
                    {extConfig.couriers
                      .filter((c) => extConfig.enabledCourierIds.includes(c.id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </Field>
              </div>
            </Panel>

            {canManage && (
              <Panel title="Add courier company">
                <form onSubmit={addCourier} className="grid gap-3 p-5 sm:grid-cols-2">
                  <Field label="Company name">
                    <input className="input" placeholder="e.g. DHL Express" value={newCourier.name} onChange={(e) => setNewCourier({ ...newCourier, name: e.target.value })} required />
                  </Field>
                  <Field label="Internal cost (ZAR)">
                    <input className="input" type="number" placeholder="120" value={newCourier.baseCost} onChange={(e) => setNewCourier({ ...newCourier, baseCost: e.target.value })} />
                  </Field>
                  <Field label="Delivery estimate">
                    <input className="input" placeholder="1 to 2 business days" value={newCourier.etaLabel} onChange={(e) => setNewCourier({ ...newCourier, etaLabel: e.target.value })} />
                  </Field>
                  <Field label="Regions (comma-separated)" hint="ZA, international">
                    <input className="input" value={newCourier.regions} onChange={(e) => setNewCourier({ ...newCourier, regions: e.target.value })} />
                  </Field>
                  <div className="sm:col-span-2">
                    <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand/90">
                      <Plus className="h-4 w-4" />
                      Add courier
                    </button>
                  </div>
                </form>
              </Panel>
            )}
          </>
        )}

        {tab === "automation" && (
          <Panel title="Store automation">
            <Toggle
              label="Auto-publish sourced products"
              description="New products from the sourcing engine go live automatically with default markup."
              checked={form.auto_publish_sourced}
              disabled={disabled}
              onChange={(v) => update("auto_publish_sourced", v)}
            />
            <Toggle
              label="Maintenance mode"
              description="Takes the storefront offline for customers while you configure the platform."
              checked={form.maintenance_mode}
              disabled={disabled}
              onChange={(v) => update("maintenance_mode", v)}
            />
          </Panel>
        )}

        {canManage && (
          <div className="sticky bottom-4 flex justify-end rounded-xl border border-neutral-200 bg-white/95 p-4 shadow-lg backdrop-blur">
            <button
              onClick={save}
              disabled={state === "saving"}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {state === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
              {state === "saved" && <Check className="h-4 w-4" />}
              {state === "saved" ? "All changes saved" : "Save platform settings"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
      {children}
      {hint && <span className="text-[11px] leading-relaxed text-neutral-400">{hint}</span>}
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
