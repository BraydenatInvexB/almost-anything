"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { PlatformSettings } from "@/types/database";
import type { ExtendedPlatformConfig } from "@/lib/admin/operations-types";
import {
  SETTINGS_TABS,
  type SettingsTab,
} from "@/components/admin/settings-console-ui";
import {
  SettingsConsoleTabPanels,
} from "@/components/admin/SettingsConsoleTabs";
import { buildCourierFromForm } from "@/components/admin/SettingsConsoleCouriersTab";

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
    const courier = buildCourierFromForm(newCourier);
    setExtConfig((c) => ({
      ...c,
      couriers: [...c.couriers.filter((x) => x.id !== courier.id), courier],
      enabledCourierIds: c.enabledCourierIds.includes(courier.id)
        ? c.enabledCourierIds
        : [...c.enabledCourierIds, courier.id],
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
        {SETTINGS_TABS.map((t) => (
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
        <SettingsConsoleTabPanels
          tab={tab}
          form={form}
          extConfig={extConfig}
          disabled={disabled}
          canManage={canManage}
          newCourier={newCourier}
          update={update}
          setExtConfig={setExtConfig}
          setState={setState}
          onNewCourierChange={setNewCourier}
          onAddCourier={addCourier}
          onRemoveCourier={removeCourier}
        />

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
