-- Storefront homepage sections (independent of category)
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_in_hot BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_in_steals BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_in_fresh_drops BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_show_in_hot ON products(show_in_hot) WHERE show_in_hot = true;
CREATE INDEX IF NOT EXISTS idx_products_show_in_steals ON products(show_in_steals) WHERE show_in_steals = true;
CREATE INDEX IF NOT EXISTS idx_products_show_in_fresh_drops ON products(show_in_fresh_drops) WHERE show_in_fresh_drops = true;

-- Backfill from legacy featured / deal flags
UPDATE products SET show_in_hot = true WHERE is_featured = true AND show_in_hot = false;
UPDATE products SET show_in_steals = true WHERE is_deal = true AND show_in_steals = false;
