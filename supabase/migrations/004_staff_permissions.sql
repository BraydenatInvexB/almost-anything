-- ============================================================================
-- 004_staff_permissions.sql
-- Per-staff module permissions, finance/hr roles, platform extended config
-- ============================================================================

-- Extend staff_role enum (safe if already applied)
DO $$ BEGIN
  ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'finance';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'hr';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Per-employee permission overrides (grant / block beyond base role)
ALTER TABLE staff_members
  ADD COLUMN IF NOT EXISTS extra_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS denied_permissions JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN staff_members.extra_permissions IS 'Permissions granted in addition to the base role';
COMMENT ON COLUMN staff_members.denied_permissions IS 'Permissions blocked even if the base role includes them';

-- Courier partners, shipping embed flags, etc.
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS extended_config JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN platform_settings.extended_config IS 'Couriers, enabledCourierIds, embedShippingInPrice, defaultCourierId';

-- Index for permission queries (optional, helps admin dashboards)
CREATE INDEX IF NOT EXISTS idx_staff_extra_permissions ON staff_members USING gin (extra_permissions);
CREATE INDEX IF NOT EXISTS idx_staff_denied_permissions ON staff_members USING gin (denied_permissions);
