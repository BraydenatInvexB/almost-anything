-- ============================================================================
-- 003_admin_rbac.sql
-- Corporate admin platform: staff/RBAC, support helpdesk, platform settings,
-- and a staff activity audit log. Includes role-aware RLS so staff can manage
-- the storefront, customers, and orders according to their role.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE staff_role AS ENUM (
    'super_admin',   -- full control, manages other staff + platform settings
    'admin',         -- broad operational control
    'manager',       -- operations oversight (orders, catalog, support)
    'support_agent', -- helpdesk: tickets, customer assistance, order lookup
    'marketing',     -- promotions, deals, featured products, newsletter
    'fulfillment',   -- order processing + shipping status
    'analyst'        -- read-only dashboards & reports
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE staff_status AS ENUM ('invited', 'active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'pending', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- staff_members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  role        staff_role NOT NULL DEFAULT 'support_agent',
  status      staff_status NOT NULL DEFAULT 'active',
  department  TEXT,
  title       TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  notes       TEXT,
  created_by  UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  last_active_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_role   ON staff_members(role);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff_members(status);
CREATE INDEX IF NOT EXISTS idx_staff_user   ON staff_members(user_id);

-- ---------------------------------------------------------------------------
-- platform_settings (single row controlling global config + markup)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_settings (
  id                      INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name              TEXT NOT NULL DEFAULT 'Almost Anything',
  support_email           TEXT NOT NULL DEFAULT 'hello@almostanything.store',
  currency                TEXT NOT NULL DEFAULT 'USD',
  default_markup_percent  DECIMAL(5,2) NOT NULL DEFAULT 18,
  min_markup_percent      DECIMAL(5,2) NOT NULL DEFAULT 8,
  max_markup_percent      DECIMAL(5,2) NOT NULL DEFAULT 45,
  free_shipping_threshold DECIMAL(10,2) NOT NULL DEFAULT 75,
  flat_shipping_fee       DECIMAL(10,2) NOT NULL DEFAULT 12,
  tax_rate                DECIMAL(5,4) NOT NULL DEFAULT 0,
  auto_publish_sourced    BOOLEAN NOT NULL DEFAULT TRUE,
  maintenance_mode        BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by              UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- support_tickets + ticket_messages (helpdesk)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number  TEXT UNIQUE NOT NULL,
  customer_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name  TEXT,
  subject        TEXT NOT NULL,
  category       TEXT NOT NULL DEFAULT 'general',
  status         ticket_status NOT NULL DEFAULT 'open',
  priority       ticket_priority NOT NULL DEFAULT 'normal',
  assigned_to    UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  order_id       UUID REFERENCES orders(id) ON DELETE SET NULL,
  last_reply_at  TIMESTAMPTZ,
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('customer', 'staff', 'system')),
  author_id   UUID,
  author_name TEXT,
  body        TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status   ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_msgs      ON ticket_messages(ticket_id);

-- ---------------------------------------------------------------------------
-- staff_activity_log (audit trail of admin actions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_activity_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id    UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  staff_name  TEXT,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  details     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_staff ON staff_activity_log(staff_id);
CREATE INDEX IF NOT EXISTS idx_activity_time  ON staff_activity_log(created_at DESC);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so RLS policies can call them safely)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_staff_role()
RETURNS staff_role AS $$
  SELECT role FROM staff_members
  WHERE user_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_members
    WHERE user_id = auth.uid() AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_members
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND role IN ('super_admin', 'admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_staff_role(roles staff_role[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_members
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND role = ANY(roles)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE staff_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_activity_log ENABLE ROW LEVEL SECURITY;

-- staff_members: staff can read the directory; only admins manage it.
CREATE POLICY "staff read directory" ON staff_members
  FOR SELECT USING (is_staff());
CREATE POLICY "admin manage staff" ON staff_members
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "service role staff" ON staff_members
  FOR ALL USING (auth.role() = 'service_role');

-- platform_settings: staff read, admins update.
CREATE POLICY "staff read settings" ON platform_settings
  FOR SELECT USING (is_staff());
CREATE POLICY "admin update settings" ON platform_settings
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "service role settings" ON platform_settings
  FOR ALL USING (auth.role() = 'service_role');

-- support_tickets: customers see their own; staff see/manage all.
CREATE POLICY "customer read own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "customer create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "staff manage tickets" ON support_tickets
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());
CREATE POLICY "service role tickets" ON support_tickets
  FOR ALL USING (auth.role() = 'service_role');

-- ticket_messages: visible to ticket owner (non-internal) + staff.
CREATE POLICY "read ticket messages" ON ticket_messages
  FOR SELECT USING (
    is_staff() OR (
      NOT is_internal AND EXISTS (
        SELECT 1 FROM support_tickets t
        WHERE t.id = ticket_messages.ticket_id AND t.customer_id = auth.uid()
      )
    )
  );
CREATE POLICY "write ticket messages" ON ticket_messages
  FOR INSERT WITH CHECK (
    is_staff() OR EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_messages.ticket_id AND t.customer_id = auth.uid()
    )
  );
CREATE POLICY "service role ticket messages" ON ticket_messages
  FOR ALL USING (auth.role() = 'service_role');

-- activity log: staff read, system/service writes.
CREATE POLICY "staff read activity" ON staff_activity_log
  FOR SELECT USING (is_staff());
CREATE POLICY "staff write activity" ON staff_activity_log
  FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "service role activity" ON staff_activity_log
  FOR ALL USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Elevate storefront tables so staff can manage them from the admin panel
-- (products manageable by admin/manager/marketing; orders by ops staff).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view products" ON products;
CREATE POLICY "Public can view products" ON products
  FOR SELECT USING (TRUE);
CREATE POLICY "Staff manage products" ON products
  FOR ALL
  USING (has_staff_role(ARRAY['super_admin','admin','manager','marketing']::staff_role[]))
  WITH CHECK (has_staff_role(ARRAY['super_admin','admin','manager','marketing']::staff_role[]));

CREATE POLICY "Staff view all orders" ON orders
  FOR SELECT USING (is_staff());
CREATE POLICY "Ops manage orders" ON orders
  FOR UPDATE
  USING (has_staff_role(ARRAY['super_admin','admin','manager','fulfillment']::staff_role[]))
  WITH CHECK (has_staff_role(ARRAY['super_admin','admin','manager','fulfillment']::staff_role[]));

CREATE POLICY "Staff view all order items" ON order_items
  FOR SELECT USING (is_staff());

CREATE POLICY "Staff view all profiles" ON profiles
  FOR SELECT USING (is_staff());

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER staff_updated_at
  BEFORE UPDATE ON staff_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Seed: bootstrap the first super admin.
-- Replace the email below, then after the user signs up they gain full access.
-- ---------------------------------------------------------------------------
-- INSERT INTO staff_members (email, full_name, role, status)
-- VALUES ('owner@almostanything.store', 'Platform Owner', 'super_admin', 'active')
-- ON CONFLICT (email) DO NOTHING;
