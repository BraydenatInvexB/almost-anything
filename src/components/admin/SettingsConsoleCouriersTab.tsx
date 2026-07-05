"use client";

import { Plus, Trash2 } from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { SettingsConsoleField as Field } from "@/components/admin/settings-console-ui";
import type { ConfigCourier, ExtendedPlatformConfig } from "@/lib/admin/operations-types";

export function SettingsConsoleCouriersTab({
  extConfig,
  canManage,
  disabled,
  newCourier,
  onExtConfigChange,
  onNewCourierChange,
  onAddCourier,
  onRemoveCourier,
}: {
  extConfig: ExtendedPlatformConfig;
  canManage: boolean;
  disabled: boolean;
  newCourier: { name: string; baseCost: string; etaLabel: string; regions: string };
  onExtConfigChange: (updater: (c: ExtendedPlatformConfig) => ExtendedPlatformConfig) => void;
  onNewCourierChange: (value: typeof newCourier) => void;
  onAddCourier: (e: React.FormEvent) => void;
  onRemoveCourier: (id: string) => void;
}) {
  return (
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
                    onExtConfigChange((cfg) => ({
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
                      onExtConfigChange((cfg) => ({
                        ...cfg,
                        couriers: cfg.couriers.map((x) => (x.id === c.id ? { ...x, baseCost: cost } : x)),
                      }));
                    }}
                  />
                  {!["courier_guy", "fastway", "aramex"].includes(c.id) && (
                    <button type="button" onClick={() => onRemoveCourier(c.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Remove courier">
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
              onChange={(e) => onExtConfigChange((c) => ({ ...c, defaultCourierId: e.target.value }))}
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
          <form onSubmit={onAddCourier} className="grid gap-3 p-5 sm:grid-cols-2">
            <Field label="Company name">
              <input className="input" placeholder="e.g. DHL Express" value={newCourier.name} onChange={(e) => onNewCourierChange({ ...newCourier, name: e.target.value })} required />
            </Field>
            <Field label="Internal cost (ZAR)">
              <input className="input" type="number" placeholder="120" value={newCourier.baseCost} onChange={(e) => onNewCourierChange({ ...newCourier, baseCost: e.target.value })} />
            </Field>
            <Field label="Delivery estimate">
              <input className="input" placeholder="1 to 2 business days" value={newCourier.etaLabel} onChange={(e) => onNewCourierChange({ ...newCourier, etaLabel: e.target.value })} />
            </Field>
            <Field label="Regions (comma-separated)" hint="ZA, international">
              <input className="input" value={newCourier.regions} onChange={(e) => onNewCourierChange({ ...newCourier, regions: e.target.value })} />
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
  );
}

export function buildCourierFromForm(form: {
  name: string;
  baseCost: string;
  etaLabel: string;
  regions: string;
}): ConfigCourier {
  const id = form.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
  return {
    id,
    name: form.name.trim(),
    baseCost: Number(form.baseCost) || 99,
    etaLabel: form.etaLabel || "3 to 5 business days",
    regions: form.regions.split(",").map((r) => r.trim()).filter(Boolean),
  };
}
