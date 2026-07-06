-- Promo codes with product/category scoping and usage tracking

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  label TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'expired')),
  discount_type TEXT NOT NULL DEFAULT 'percent'
    CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(12, 2) NOT NULL,
  scope TEXT NOT NULL DEFAULT 'all'
    CHECK (scope IN ('all', 'products', 'categories')),
  product_ids TEXT[] NOT NULL DEFAULT '{}',
  category_slugs TEXT[] NOT NULL DEFAULT '{}',
  min_order_amount NUMERIC(12, 2),
  max_discount_amount NUMERIC(12, 2),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes (UPPER(code));

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'promo_codes' AND policyname = 'service_role_all_promo_codes'
  ) THEN
    CREATE POLICY service_role_all_promo_codes ON promo_codes
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

DROP TRIGGER IF EXISTS promo_codes_updated_at ON promo_codes;
CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
