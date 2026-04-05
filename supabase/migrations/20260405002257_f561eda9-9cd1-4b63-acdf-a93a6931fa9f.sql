
-- Drop old overly-permissive policies if they exist
DROP POLICY IF EXISTS "Anyone can upload event assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Scoped storage policies
CREATE POLICY "Authenticated upload to event-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-assets');

CREATE POLICY "Authenticated update event-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-assets')
WITH CHECK (bucket_id = 'event-assets');

CREATE POLICY "Authenticated delete event-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-assets');

CREATE POLICY "Public read event-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-assets');
