-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('supplier-docs', 'supplier-docs', false),
  ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for supplier-docs bucket
CREATE POLICY "Authenticated users can upload supplier docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'supplier-docs');

CREATE POLICY "Authenticated users can read supplier docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'supplier-docs');

CREATE POLICY "Authenticated users can update supplier docs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'supplier-docs');

-- Storage policies for exports bucket
CREATE POLICY "Authenticated users can upload exports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exports');

CREATE POLICY "Authenticated users can read exports"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'exports');

CREATE POLICY "Authenticated users can update exports"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'exports');

