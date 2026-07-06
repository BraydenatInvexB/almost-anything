-- Default warehouse origin for new products and CSV stock imports
ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS default_stock_origin TEXT NOT NULL DEFAULT 'sa_warehouse'
  CHECK (default_stock_origin IN ('sa_warehouse', 'overseas'));
