"use client";

import { Panel } from "@/components/admin/ui";
import {
  SettingsConsoleField as Field,
  SettingsConsoleToggle as Toggle,
} from "@/components/admin/settings-console-ui";
import type { PlatformSettings } from "@/types/database";
import type { ExtendedPlatformConfig } from "@/lib/admin/operations-types";

export type SettingsConsoleTabPanelsProps = {
  tab: import("@/components/admin/settings-console-ui").SettingsTab;
  form: PlatformSettings;
  extConfig: ExtendedPlatformConfig;
  disabled: boolean;
  update: <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => void;
  setExtConfig: React.Dispatch<React.SetStateAction<ExtendedPlatformConfig>>;
};

export function SettingsConsoleTabPanels({
  tab,
  form,
  extConfig,
  disabled,
  update,
  setExtConfig,
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
          description="Almost Anything coordinates collection and delivery for every customer order."
        >
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field
              label="Single-store orders"
              hint="Almost Anything collects from the seller and delivers to the customer."
            >
              <select
                disabled
                className="input disabled:opacity-60"
                value="platform_driver"
                onChange={() => {}}
              >
                <option value="platform_driver">Almost Anything Delivery</option>
              </select>
            </Field>
            <Field
              label="Multi-store orders"
              hint="Almost Anything coordinates all collections as one delivery workflow."
            >
              <select
                disabled
                className="input disabled:opacity-60"
                value="platform_driver"
                onChange={() => {}}
              >
                <option value="platform_driver">Almost Anything Delivery</option>
              </select>
            </Field>
          </div>
        </Panel>
        <Panel title="Delivery pricing strategy">
          <Toggle
            label="Embed delivery cost in product prices"
            description="Customers see FREE delivery at checkout. Almost Anything delivery costs are built into retail prices."
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
