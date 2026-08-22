-- Fix storage + categories RLS for icon uploads
-- Run this in Supabase SQL Editor

-- 1. Make bucket public for reads (if not already)
UPDATE storage.buckets SET public = true WHERE id = 'product-images';

-- 2. Allow anyone to read files from product-images
DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 3. Allow authenticated users to upload files
DROP POLICY IF EXISTS "auth_insert_product_images" ON storage.objects;
CREATE POLICY "auth_insert_product_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- 4. Allow authenticated users to delete files
DROP POLICY IF EXISTS "auth_delete_product_images" ON storage.objects;
CREATE POLICY "auth_delete_product_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- 5. Fix categories table RLS (allow authenticated UPDATE)
DROP POLICY IF EXISTS "categories_update_auth" ON public.categories;
CREATE POLICY "categories_update_auth"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
