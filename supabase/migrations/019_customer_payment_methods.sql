-- Saved Paystack card authorizations for logged-in customers

CREATE TABLE IF NOT EXISTS customer_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'paystack',
  authorization_code TEXT NOT NULL,
  customer_code TEXT,
  card_type TEXT,
  last4 TEXT NOT NULL,
  exp_month TEXT,
  exp_year TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_payment_methods_user ON customer_payment_methods(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_payment_methods_one_default
  ON customer_payment_methods(user_id) WHERE is_default = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_payment_methods_auth
  ON customer_payment_methods(user_id, authorization_code);

ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_payment_methods_select_own ON customer_payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY customer_payment_methods_delete_own ON customer_payment_methods
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY customer_payment_methods_service_role ON customer_payment_methods
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS customer_payment_methods_updated_at ON customer_payment_methods;
CREATE TRIGGER customer_payment_methods_updated_at
  BEFORE UPDATE ON customer_payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
