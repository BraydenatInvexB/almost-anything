"use client";

import { useEffect, useState } from "react";
import { COURIERS } from "@/config/couriers";
import {
  DEFAULT_PRICING_SETTINGS,
  type StorefrontPricingSettings,
} from "@/lib/pricing/storefront-totals";

export function useStorefrontSettings() {
  const [settings, setSettings] = useState<StorefrontPricingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/storefront/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          freeShippingThreshold: data.freeShippingThreshold ?? DEFAULT_PRICING_SETTINGS.freeShippingThreshold,
          flatShippingFee: data.flatShippingFee ?? DEFAULT_PRICING_SETTINGS.flatShippingFee,
          taxRate: data.taxRate ?? DEFAULT_PRICING_SETTINGS.taxRate,
          embedShippingInPrice: data.embedShippingInPrice ?? DEFAULT_PRICING_SETTINGS.embedShippingInPrice,
          freeShippingEnabled: data.freeShippingEnabled ?? DEFAULT_PRICING_SETTINGS.freeShippingEnabled,
          flatShippingFeeEnabled: data.flatShippingFeeEnabled ?? DEFAULT_PRICING_SETTINGS.flatShippingFeeEnabled,
          defaultCourierId: data.defaultCourierId ?? DEFAULT_PRICING_SETTINGS.defaultCourierId,
          currency: data.currency ?? DEFAULT_PRICING_SETTINGS.currency,
          config: data.config,
        });
      })
      .catch(() => setSettings(DEFAULT_PRICING_SETTINGS))
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}

export function defaultCouriersFromSettings(settings: StorefrontPricingSettings | null) {
  if (settings?.config?.couriers?.length) {
    return settings.config.couriers.map((c) => ({
      id: c.id,
      name: c.name,
      etaLabel: c.etaLabel,
    }));
  }
  return COURIERS.map((c) => ({ id: c.id, name: c.name, etaLabel: c.etaLabel }));
}
