-- Saved shipping addresses for logged-in customers

CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'ZA',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user ON customer_addresses(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_addresses_one_default
  ON customer_addresses(user_id) WHERE is_default = true;

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_addresses_select_own ON customer_addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY customer_addresses_insert_own ON customer_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY customer_addresses_update_own ON customer_addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY customer_addresses_delete_own ON customer_addresses
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY customer_addresses_service_role ON customer_addresses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS customer_addresses_updated_at ON customer_addresses;
CREATE TRIGGER customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
