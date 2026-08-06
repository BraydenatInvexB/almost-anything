-- Admin-managed promotional collections shown in the storefront navigation.
ALTER TABLE marketing_campaigns
  ADD COLUMN IF NOT EXISTS storefront_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS storefront_label TEXT,
  ADD COLUMN IF NOT EXISTS storefront_slug TEXT,
  ADD COLUMN IF NOT EXISTS storefront_product_slugs TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS storefront_order INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_campaigns_storefront_slug
  ON marketing_campaigns (storefront_slug)
  WHERE storefront_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_storefront_schedule
  ON marketing_campaigns (storefront_enabled, status, starts_at, ends_at)
  WHERE storefront_enabled = true;
