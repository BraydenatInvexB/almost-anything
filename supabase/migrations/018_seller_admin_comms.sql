-- Admin ↔ seller communications and product moderation support

CREATE TABLE IF NOT EXISTS seller_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'seller')),
  sender_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('normal', 'important', 'action_required')),
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_messages_seller ON seller_messages(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_messages_created ON seller_messages(seller_id, created_at DESC);

ALTER TABLE seller_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY seller_messages_service_role ON seller_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
