-- Seller marketplace: merchants, documents, team, subscriptions, payouts

CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  shop_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  company_name TEXT NOT NULL,
  registration_number TEXT,
  vat_number TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  business_address JSONB NOT NULL DEFAULT '{}',
  category_slugs TEXT[] NOT NULL DEFAULT '{}',
  sells_all_categories BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'suspended', 'rejected')),
  plan TEXT NOT NULL DEFAULT 'starter_30'
    CHECK (plan IN ('starter_30', 'growth_50', 'unlimited')),
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
  subscription_starts_at TIMESTAMPTZ,
  first_sale_at TIMESTAMPTZ,
  preferred_couriers TEXT[] NOT NULL DEFAULT '{}',
  bank_details JSONB NOT NULL DEFAULT '{}',
  onboarding JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sellers_user ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_status ON sellers(status);
CREATE INDEX IF NOT EXISTS idx_sellers_slug ON sellers(slug);

CREATE TABLE IF NOT EXISTS seller_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL
    CHECK (doc_type IN ('registration', 'vat', 'bank', 'id', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_documents_seller ON seller_documents(seller_id);

CREATE TABLE IF NOT EXISTS seller_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff'
    CHECK (role IN ('owner', 'manager', 'inventory', 'support', 'staff')),
  status TEXT NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'active', 'suspended')),
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (seller_id, email)
);

CREATE INDEX IF NOT EXISTS idx_seller_team_seller ON seller_team_members(seller_id);

CREATE TABLE IF NOT EXISTS seller_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller ON seller_payouts(seller_id);

CREATE TABLE IF NOT EXISTS seller_stock_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS listing_status TEXT DEFAULT 'published';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);

ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_promo_codes_seller ON promo_codes(seller_id);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS seller_fulfilled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS seller_tracking_number TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS seller_courier TEXT;

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_stock_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY sellers_service_role ON sellers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY seller_documents_service_role ON seller_documents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY seller_team_service_role ON seller_team_members FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY seller_payouts_service_role ON seller_payouts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY seller_imports_service_role ON seller_stock_imports FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY sellers_select_public ON sellers FOR SELECT USING (status = 'approved');
CREATE POLICY sellers_select_own ON sellers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY sellers_update_own ON sellers FOR UPDATE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS sellers_updated_at ON sellers;
CREATE TRIGGER sellers_updated_at BEFORE UPDATE ON sellers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS seller_team_updated_at ON seller_team_members;
CREATE TRIGGER seller_team_updated_at BEFORE UPDATE ON seller_team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
