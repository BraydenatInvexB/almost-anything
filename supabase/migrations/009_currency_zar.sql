-- Storefront prices are authored in South African Rand (ZAR).
UPDATE public.products SET currency = 'ZAR' WHERE currency = 'USD';

ALTER TABLE public.products ALTER COLUMN currency SET DEFAULT 'ZAR';
ALTER TABLE public.orders ALTER COLUMN currency SET DEFAULT 'ZAR';
