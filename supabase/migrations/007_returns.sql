-- Return requests (RMA) linked to orders
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rma_number TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  reason TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  method TEXT NOT NULL DEFAULT 'courier_pickup',
  status TEXT NOT NULL DEFAULT 'requested',
  refund_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  restock_items BOOLEAN NOT NULL DEFAULT true,
  assigned_to UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  notes JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_email ON return_requests(customer_email);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);
CREATE INDEX IF NOT EXISTS idx_return_requests_rma ON return_requests(rma_number);

ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY return_requests_customer_read ON return_requests
  FOR SELECT USING (auth.uid() = user_id OR customer_email = auth.jwt() ->> 'email');

CREATE POLICY return_requests_customer_insert ON return_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
