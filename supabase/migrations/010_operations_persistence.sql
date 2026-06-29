-- Operations persistence: procurement, inventory, finance, marketing, analytics, live chat
-- Extends customer_requests for admin item-request desk

-- ---------------------------------------------------------------------------
-- Procurement
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS procurement_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  order_item_id TEXT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  supplier TEXT NOT NULL,
  supplier_country TEXT NOT NULL,
  supplier_order_ref TEXT,
  inbound_tracking TEXT,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  actual_cost_paid NUMERIC(12, 2),
  sell_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ordered', 'in_transit', 'received', 'cancelled')),
  origin TEXT NOT NULL DEFAULT 'overseas'
    CHECK (origin IN ('sa_warehouse', 'overseas')),
  ordered_at TIMESTAMPTZ,
  expected_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_procurement_order ON procurement_records(order_id);
CREATE INDEX IF NOT EXISTS idx_procurement_order_number ON procurement_records(order_number);
CREATE INDEX IF NOT EXISTS idx_procurement_status ON procurement_records(status);

-- ---------------------------------------------------------------------------
-- Inventory
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 5,
  origin TEXT NOT NULL DEFAULT 'sa_warehouse'
    CHECK (origin IN ('sa_warehouse', 'overseas')),
  warehouse TEXT NOT NULL DEFAULT 'Johannesburg DC',
  last_counted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_records(sku);

-- ---------------------------------------------------------------------------
-- Finance
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  vendor TEXT,
  order_id TEXT,
  recorded_by TEXT NOT NULL,
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_recorded ON expenses(recorded_at DESC);

CREATE TABLE IF NOT EXISTS supplier_payables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  vendor TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'overdue', 'cancelled')),
  order_id TEXT,
  order_number TEXT,
  procurement_id UUID REFERENCES procurement_records(id) ON DELETE SET NULL,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payables_status ON supplier_payables(status);
CREATE INDEX IF NOT EXISTS idx_payables_due ON supplier_payables(due_date);

-- ---------------------------------------------------------------------------
-- Marketing
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'multi',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'live', 'ended')),
  promo_code TEXT,
  discount_percent NUMERIC(5, 2),
  audience TEXT NOT NULL DEFAULT 'All subscribers',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  reach INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_marketing_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'unsubscribed')),
  tags TEXT[] DEFAULT '{}',
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  preview_text TEXT,
  body TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sent')),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Analytics
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_analytics_daily (
  date DATE PRIMARY KEY,
  visits INTEGER NOT NULL DEFAULT 0,
  orders INTEGER NOT NULL DEFAULT 0,
  page_views INTEGER NOT NULL DEFAULT 0,
  unique_sessions INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_analytics_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL UNIQUE,
  views INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Live chat
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS live_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT NOT NULL,
  visitor_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  assigned_to UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_chat_sessions(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('visitor', 'staff', 'system')),
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON live_chat_messages(session_id, created_at);

-- ---------------------------------------------------------------------------
-- Item requests (extend customer_requests)
-- ---------------------------------------------------------------------------
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS request_number TEXT;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS budget NUMERIC(12, 2);
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ZAR';
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'standard';
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES staff_members(id) ON DELETE SET NULL;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS quoted_amount NUMERIC(12, 2);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_requests_number
  ON customer_requests(request_number) WHERE request_number IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Return requests — staff / service access
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS return_requests_service_all ON return_requests;
CREATE POLICY return_requests_service_all ON return_requests
  FOR ALL USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- RLS + service role for operations tables
-- ---------------------------------------------------------------------------
ALTER TABLE procurement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_marketing_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_analytics_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'procurement_records', 'inventory_records', 'expenses', 'supplier_payables',
    'marketing_campaigns', 'email_marketing_subscribers', 'email_broadcasts',
    'site_analytics_daily', 'site_analytics_pages',
    'live_chat_sessions', 'live_chat_messages'
  ]
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I',
      t || '_service_all', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (auth.role() = ''service_role'')',
      t || '_service_all', t
    );
  END LOOP;
END $$;

-- updated_at triggers
DROP TRIGGER IF EXISTS procurement_records_updated_at ON procurement_records;
CREATE TRIGGER procurement_records_updated_at
  BEFORE UPDATE ON procurement_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS inventory_records_updated_at ON inventory_records;
CREATE TRIGGER inventory_records_updated_at
  BEFORE UPDATE ON inventory_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS supplier_payables_updated_at ON supplier_payables;
CREATE TRIGGER supplier_payables_updated_at
  BEFORE UPDATE ON supplier_payables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS marketing_campaigns_updated_at ON marketing_campaigns;
CREATE TRIGGER marketing_campaigns_updated_at
  BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS email_broadcasts_updated_at ON email_broadcasts;
CREATE TRIGGER email_broadcasts_updated_at
  BEFORE UPDATE ON email_broadcasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS live_chat_sessions_updated_at ON live_chat_sessions;
CREATE TRIGGER live_chat_sessions_updated_at
  BEFORE UPDATE ON live_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
