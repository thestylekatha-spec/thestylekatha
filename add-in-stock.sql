-- Add in_stock column to products table
-- Run this in Supabase SQL Editor

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;

-- Update RLS policies to include in_stock for public selection
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public"
  ON public.products FOR SELECT
  USING (is_active = true AND in_stock = true);

-- Update RLS policies for authenticated users
DROP POLICY IF EXISTS "products_select_auth" ON public.products;
CREATE POLICY "products_select_auth"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);