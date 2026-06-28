-- Allow available_international stock status on products
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_status_check;
ALTER TABLE products ADD CONSTRAINT products_stock_status_check
  CHECK (stock_status IN (
    'in_stock',
    'available_international',
    'low_stock',
    'out_of_stock',
    'sourced'
  ));
