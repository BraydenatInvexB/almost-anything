"use client";

import { Panel } from "@/components/admin/ui";
import {
  SettingsConsoleField as Field,
  SettingsConsoleToggle as Toggle,
} from "@/components/admin/settings-console-ui";
import { SettingsConsoleCouriersTab } from "@/components/admin/SettingsConsoleCouriersTab";
import type { PlatformSettings } from "@/types/database";
import type { ExtendedPlatformConfig } from "@/lib/admin/operations-types";

export type SettingsConsoleTabPanelsProps = {
  tab: import("@/components/admin/settings-console-ui").SettingsTab;
  form: PlatformSettings;
  extConfig: ExtendedPlatformConfig;
  disabled: boolean;
  canManage: boolean;
  newCourier: { name: string; baseCost: string; etaLabel: string; regions: string };
  update: <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => void;
  setExtConfig: React.Dispatch<React.SetStateAction<ExtendedPlatformConfig>>;
  setState: React.Dispatch<React.SetStateAction<"idle" | "saving" | "saved">>;
  onNewCourierChange: (value: { name: string; baseCost: string; etaLabel: string; regions: string }) => void;
  onAddCourier: (e: React.FormEvent) => void;
  onRemoveCourier: (id: string) => void;
};

export function SettingsConsoleTabPanels({
  tab,
  form,
  extConfig,
  disabled,
  canManage,
  newCourier,
  update,
  setExtConfig,
  setState,
  onNewCourierChange,
  onAddCourier,
  onRemoveCourier,
}: SettingsConsoleTabPanelsProps) {
  if (tab === "general") {
    return (
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
    );
  }

  if (tab === "pricing") {
    return (
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
    );
  }

  if (tab === "shipping") {
    return (
      <>
        <Panel title="Shipping & tax">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field
              label="Free shipping threshold (ZAR)"
              hint="Only applies when free shipping is enabled below."
            >
              <input
                type="number"
                disabled={disabled || !extConfig.freeShippingEnabled}
                value={form.free_shipping_threshold}
                onChange={(e) => update("free_shipping_threshold", Number(e.target.value))}
                className="input disabled:opacity-60"
              />
            </Field>
            <Field label="VAT rate (decimal)" hint="e.g. 0.15 for 15%">
              <input type="number" step="0.01" disabled={disabled} value={form.tax_rate} onChange={(e) => update("tax_rate", Number(e.target.value))} className="input disabled:opacity-60" />
            </Field>
          </div>
        </Panel>
        <Panel
          title="Delivery fees"
          description="What customers pay at checkout when delivery is not built into item prices. Large/bulky items (TV, fridge) use the higher fee."
        >
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field
              label="Normal delivery (ZAR)"
              hint="Small and medium parcels — usually R100."
            >
              <input
                type="number"
                min={0}
                step={1}
                disabled={disabled || !extConfig.flatShippingFeeEnabled}
                value={extConfig.deliveryFees?.standardZar ?? form.flat_shipping_fee}
                onChange={(e) => {
                  const standardZar = Number(e.target.value);
                  update("flat_shipping_fee", standardZar);
                  setExtConfig((c) => ({
                    ...c,
                    deliveryFees: {
                      standardZar,
                      largeItemZar: c.deliveryFees?.largeItemZar ?? 200,
                    },
                  }));
                }}
                className="input disabled:opacity-60"
              />
            </Field>
            <Field
              label="Large / bulky items (ZAR)"
              hint="TVs, fridges, furniture — usually R200."
            >
              <input
                type="number"
                min={0}
                step={1}
                disabled={disabled || !extConfig.flatShippingFeeEnabled}
                value={extConfig.deliveryFees?.largeItemZar ?? 200}
                onChange={(e) => {
                  const largeItemZar = Number(e.target.value);
                  setExtConfig((c) => ({
                    ...c,
                    deliveryFees: {
                      standardZar: c.deliveryFees?.standardZar ?? (Number(form.flat_shipping_fee) || 100),
                      largeItemZar,
                    },
                  }));
                }}
                className="input disabled:opacity-60"
              />
            </Field>
          </div>
        </Panel>
        <Panel
          title="Who delivers?"
          description="Keep it simple: one store → shop delivers. Multiple stores → Almost Anything drivers. Change anytime."
        >
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field
              label="Customer buys from one store"
              hint="Usually the shop owner delivers (no courier partners)."
            >
              <select
                disabled={disabled}
                className="input disabled:opacity-60"
                value={extConfig.deliveryRouting?.singleStoreMode ?? "seller_self"}
                onChange={(e) =>
                  setExtConfig((c) => ({
                    ...c,
                    deliveryRouting: {
                      ...c.deliveryRouting,
                      singleStoreMode: e.target.value as ExtendedPlatformConfig["deliveryRouting"]["singleStoreMode"],
                      multiStoreMode: c.deliveryRouting?.multiStoreMode ?? "platform_driver",
                    },
                  }))
                }
              >
                <option value="seller_self">Store delivers</option>
                <option value="platform_driver">Almost Anything drivers</option>
                <option value="courier_partner">Courier partners</option>
              </select>
            </Field>
            <Field
              label="Customer buys from multiple stores"
              hint="Usually Almost Anything collects from shops and delivers to the customer."
            >
              <select
                disabled={disabled}
                className="input disabled:opacity-60"
                value={extConfig.deliveryRouting?.multiStoreMode ?? "platform_driver"}
                onChange={(e) =>
                  setExtConfig((c) => ({
                    ...c,
                    deliveryRouting: {
                      ...c.deliveryRouting,
                      singleStoreMode: c.deliveryRouting?.singleStoreMode ?? "seller_self",
                      multiStoreMode: e.target.value as ExtendedPlatformConfig["deliveryRouting"]["multiStoreMode"],
                    },
                  }))
                }
              >
                <option value="platform_driver">Almost Anything drivers</option>
                <option value="courier_partner">Courier partners</option>
                <option value="seller_self">Each store delivers their own items</option>
              </select>
            </Field>
          </div>
        </Panel>
        <Panel title="Delivery pricing strategy">
          <Toggle
            label="Embed delivery cost in product prices"
            description="Customers see FREE delivery at checkout. Courier fees are built into retail prices."
            checked={extConfig.embedShippingInPrice}
            disabled={disabled}
            onChange={(v) => setExtConfig((c) => ({ ...c, embedShippingInPrice: v }))}
          />
          <Toggle
            label="Offer free shipping above threshold"
            description="When off, customers pay delivery on every order (unless delivery is embedded in prices)."
            checked={extConfig.freeShippingEnabled}
            disabled={disabled}
            onChange={(v) => setExtConfig((c) => ({ ...c, freeShippingEnabled: v }))}
          />
          <Toggle
            label="Charge delivery fee at checkout"
            description="When on, customers pay the normal or large-item fee above (unless free shipping applies). Turn off if delivery is already built into prices."
            checked={extConfig.flatShippingFeeEnabled}
            disabled={disabled}
            onChange={(v) => setExtConfig((c) => ({ ...c, flatShippingFeeEnabled: v }))}
          />
        </Panel>
      </>
    );
  }

  if (tab === "couriers") {
    return (
      <SettingsConsoleCouriersTab
        extConfig={extConfig}
        canManage={canManage}
        disabled={disabled}
        newCourier={newCourier}
        onExtConfigChange={(updater) => setExtConfig(updater)}
        onNewCourierChange={onNewCourierChange}
        onAddCourier={onAddCourier}
        onRemoveCourier={onRemoveCourier}
      />
    );
  }

  if (tab === "automation") {
    return (
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
        <Toggle
          label="Driver portal"
          description="Shows Become a driver and Driver sign in on the storefront. Turning this off also closes the public driver login and application pages without deleting driver records."
          checked={extConfig.driverPortalEnabled ?? true}
          disabled={disabled}
          onChange={(v) => setExtConfig((c) => ({ ...c, driverPortalEnabled: v }))}
        />
      </Panel>
    );
  }

  return null;
}
