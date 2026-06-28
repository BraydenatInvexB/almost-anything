-- Almost Anything — Supabase Schema
-- Run via Supabase CLI: supabase db push
-- Or paste into Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products catalog (populated by Python sourcing engine + ingest API)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  base_price DECIMAL(10, 2) NOT NULL,
  retail_price DECIMAL(10, 2) NOT NULL,
  markup_percent DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  rating DECIMAL(2, 1) NOT NULL DEFAULT 4.5,
  review_count INTEGER NOT NULL DEFAULT 0,
  stock_status TEXT NOT NULL DEFAULT 'sourced'
    CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'sourced')),
  image_url TEXT,
  enhanced_image_url TEXT,
  source_url TEXT,
  source_name TEXT,
  delivery_days_min INTEGER NOT NULL DEFAULT 5,
  delivery_days_max INTEGER NOT NULL DEFAULT 14,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_exclusive BOOLEAN NOT NULL DEFAULT FALSE,
  is_deal BOOLEAN NOT NULL DEFAULT FALSE,
  deal_discount_percent INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_deals ON products(is_deal) WHERE is_deal = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Customer sourcing requests
CREATE TABLE IF NOT EXISTS customer_requests (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  parsed_intent JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'searching', 'found', 'quoted',
      'purchased', 'shipped', 'delivered', 'failed'
    )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_requests_status ON customer_requests(status);
CREATE INDEX IF NOT EXISTS idx_customer_requests_user ON customer_requests(user_id);

-- Quote options (cheapest / fastest / best quality)
CREATE TABLE IF NOT EXISTS quote_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT NOT NULL REFERENCES customer_requests(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('cheapest', 'fastest', 'best_quality')),
  product_name TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  supplier_url TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  retail_price DECIMAL(10, 2) NOT NULL,
  delivery_days INTEGER NOT NULL DEFAULT 7,
  quality_score INTEGER NOT NULL DEFAULT 80,
  rating DECIMAL(2, 1),
  image_url TEXT,
  enhanced_image_url TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_options_request ON quote_options(request_id);

-- Raw scraped supplier listings
CREATE TABLE IF NOT EXISTS sourced_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,
  supplier_url TEXT NOT NULL,
  raw_price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  availability TEXT,
  delivery_estimate TEXT,
  rating DECIMAL(2, 1),
  review_count INTEGER,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_sourced_listings_product ON sourced_listings(product_id);
CREATE INDEX IF NOT EXISTS idx_sourced_listings_scraped ON sourced_listings(scraped_at DESC);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- API audit log for security monitoring
CREATE TABLE IF NOT EXISTS api_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route TEXT NOT NULL,
  method TEXT NOT NULL,
  ip_address TEXT,
  user_id UUID,
  status_code INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_audit_created ON api_audit_log(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER customer_requests_updated_at
  BEFORE UPDATE ON customer_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE sourced_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_audit_log ENABLE ROW LEVEL SECURITY;

-- Public read access for products
CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT
  USING (true);

-- Service role handles writes (via API with service key)
CREATE POLICY "Service role full access products"
  ON products FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Public can insert newsletter"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role newsletter access"
  ON newsletter_subscribers FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role customer requests"
  ON customer_requests FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role quote options"
  ON quote_options FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role sourced listings"
  ON sourced_listings FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role audit log"
  ON api_audit_log FOR ALL
  USING (auth.role() = 'service_role');

-- Seed sample products
INSERT INTO products (
  slug, name, description, category, base_price, retail_price,
  markup_percent, rating, review_count, image_url, enhanced_image_url,
  source_url, source_name, is_featured, is_deal, deal_discount_percent
) VALUES
(
  'long-chair-curved', 'Long Chair',
  'A sculptural curved sofa with premium textured upholstery.',
  'sofa', 430.00, 508.00, 18.1, 4.9, 284,
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&h=1200&fit=crop&q=90',
  'https://example.com/supplier/long-chair', 'Nordic Home Direct',
  TRUE, TRUE, 25
),
(
  'minimal-oak-armchair', 'Oak Frame Armchair',
  'Minimalist armchair with solid oak legs. Great value at 50-75% off.',
  'chair', 289.00, 341.00, 18.0, 4.9, 156,
  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=900&h=700&fit=crop',
  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=900&h=700&fit=crop&q=90',
  'https://example.com/supplier/oak-armchair', 'Artisan Loft Co.',
  TRUE, TRUE, 60
),
(
  'purespace-focus-duo', 'PureSpace Focus Duo',
  'Sleek minimalist design meets exceptional comfort. Exclusive sourcing find.',
  'chair', 620.00, 732.00, 18.0, 4.8, 98,
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&h=700&fit=crop',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&h=700&fit=crop&q=90',
  'https://example.com/supplier/purespace', 'Studio Essentials',
  TRUE, FALSE, NULL
)
ON CONFLICT (slug) DO NOTHING;
