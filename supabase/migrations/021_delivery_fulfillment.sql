-- Delivery fulfillment: drivers + delivery jobs (seller self-ship vs platform drivers)

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  province TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  vehicle_notes TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drivers_province ON drivers(province);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_user ON drivers(user_id);

CREATE TABLE IF NOT EXISTS delivery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  mode TEXT NOT NULL
    CHECK (mode IN ('seller_self', 'platform_driver', 'courier_partner')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'awaiting_seller',
      'ready_for_driver',
      'assigned',
      'collecting',
      'out_for_delivery',
      'delivered',
      'cancelled'
    )),
  seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  province TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'ZA',
  item_summary TEXT,
  item_count INT NOT NULL DEFAULT 1,
  notes TEXT,
  assigned_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_jobs_order ON delivery_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_status ON delivery_jobs(status);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_mode ON delivery_jobs(mode);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_seller ON delivery_jobs(seller_id);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_driver ON delivery_jobs(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_province_status ON delivery_jobs(province, status);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_jobs ENABLE ROW LEVEL SECURITY;

-- Drivers can read/update their own profile
DROP POLICY IF EXISTS "Drivers read own profile" ON drivers;
CREATE POLICY "Drivers read own profile" ON drivers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Drivers update own profile" ON drivers;
CREATE POLICY "Drivers update own profile" ON drivers
  FOR UPDATE USING (auth.uid() = user_id);

-- Drivers can see/update jobs assigned to them
DROP POLICY IF EXISTS "Drivers read assigned jobs" ON delivery_jobs;
CREATE POLICY "Drivers read assigned jobs" ON delivery_jobs
  FOR SELECT USING (
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
    OR status = 'ready_for_driver'
  );

DROP POLICY IF EXISTS "Drivers update assigned jobs" ON delivery_jobs;
CREATE POLICY "Drivers update assigned jobs" ON delivery_jobs
  FOR UPDATE USING (
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  );

-- Sellers can see their self-delivery jobs
DROP POLICY IF EXISTS "Sellers read own delivery jobs" ON delivery_jobs;
CREATE POLICY "Sellers read own delivery jobs" ON delivery_jobs
  FOR SELECT USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Sellers update own delivery jobs" ON delivery_jobs;
CREATE POLICY "Sellers update own delivery jobs" ON delivery_jobs
  FOR UPDATE USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    AND mode = 'seller_self'
  );
