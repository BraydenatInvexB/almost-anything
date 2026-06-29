-- Search intelligence + sourcing pipeline run tracking

CREATE TABLE IF NOT EXISTS search_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  input_method TEXT NOT NULL DEFAULT 'text'
    CHECK (input_method IN ('text', 'voice', 'image', 'request', 'admin')),
  source TEXT NOT NULL DEFAULT 'storefront',
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  result_count INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_events_normalized ON search_events(normalized_query);
CREATE INDEX IF NOT EXISTS idx_search_events_created ON search_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_events_source ON search_events(source);

CREATE TABLE IF NOT EXISTS sourcing_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT REFERENCES customer_requests(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  input_method TEXT NOT NULL DEFAULT 'text',
  product_profile JSONB NOT NULL DEFAULT '{}',
  listings_found INTEGER NOT NULL DEFAULT 0,
  quotes_created INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_sourcing_runs_request ON sourcing_runs(request_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_runs_status ON sourcing_runs(status);
CREATE INDEX IF NOT EXISTS idx_sourcing_runs_started ON sourcing_runs(started_at DESC);
