-- Public bucket for admin product image uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Service role upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');
