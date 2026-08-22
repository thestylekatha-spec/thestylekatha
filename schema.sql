-- ============================================
-- THE STYLE KATHA — Complete Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  price NUMERIC(10,2) NOT NULL,
  old_price NUMERIC(10,2),
  badge TEXT,
  badge_alt BOOLEAN DEFAULT false,
  image_url TEXT NOT NULL,
  image_path TEXT,
  description TEXT,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_mobile TEXT NOT NULL,
  customer_alt_mobile TEXT,
  address TEXT,
  mandal TEXT,
  district TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  phone TEXT,
  phone_display TEXT,
  whatsapp TEXT,
  email TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories(sort_order);

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES — CATEGORIES
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "categories_insert_auth" ON public.categories;
CREATE POLICY "categories_insert_auth"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "categories_update_auth" ON public.categories;
CREATE POLICY "categories_update_auth"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "categories_delete_auth" ON public.categories;
CREATE POLICY "categories_delete_auth"
  ON public.categories FOR DELETE
  TO authenticated
  USING (true);

-- 8. RLS POLICIES — PRODUCTS
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public"
  ON public.products FOR SELECT
  USING (is_active = true AND in_stock = true);

DROP POLICY IF EXISTS "products_select_auth" ON public.products;
CREATE POLICY "products_select_auth"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "products_insert_auth" ON public.products;
CREATE POLICY "products_insert_auth"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "products_update_auth" ON public.products;
CREATE POLICY "products_update_auth"
  ON public.products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "products_delete_auth" ON public.products;
CREATE POLICY "products_delete_auth"
  ON public.products FOR DELETE
  TO authenticated
  USING (true);

-- 9. RLS POLICIES — ORDERS
DROP POLICY IF EXISTS "orders_insert_public" ON public.orders;
CREATE POLICY "orders_insert_public"
  ON public.orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "orders_select_auth" ON public.orders;
CREATE POLICY "orders_select_auth"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "orders_update_auth" ON public.orders;
CREATE POLICY "orders_update_auth"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 10. RLS POLICIES — SITE SETTINGS
DROP POLICY IF EXISTS "settings_select_public" ON public.site_settings;
CREATE POLICY "settings_select_public"
  ON public.site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "settings_upsert_auth" ON public.site_settings;
CREATE POLICY "settings_upsert_auth"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "settings_update_auth" ON public.site_settings;
CREATE POLICY "settings_update_auth"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 11. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('cat-icons', 'cat-icons', true)
ON CONFLICT (id) DO NOTHING;

-- 12. STORAGE POLICIES
DROP POLICY IF EXISTS "products_select_public" ON storage.objects;
CREATE POLICY "products_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

DROP POLICY IF EXISTS "products_insert_auth" ON storage.objects;
CREATE POLICY "products_insert_auth"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "products_delete_auth" ON storage.objects;
CREATE POLICY "products_delete_auth"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'products');

DROP POLICY IF EXISTS "caticons_select_public" ON storage.objects;
CREATE POLICY "caticons_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cat-icons');

DROP POLICY IF EXISTS "caticons_insert_auth" ON storage.objects;
CREATE POLICY "caticons_insert_auth"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cat-icons');

DROP POLICY IF EXISTS "caticons_delete_auth" ON storage.objects;
CREATE POLICY "caticons_delete_auth"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'cat-icons');

-- 13. SEED DEFAULT SITE SETTINGS
INSERT INTO public.site_settings (id, phone, phone_display, whatsapp, email)
VALUES ('main', '91123456789', '+91 12345 67890', '91123456789', NULL)
ON CONFLICT (id) DO NOTHING;

-- 14. SEED 9 DEFAULT CATEGORIES
INSERT INTO public.categories (id, name, slug, sort_order, is_active) VALUES
  ('cat_necklace', 'Necklace', 'necklace', 1, true),
  ('cat_earring', 'Earring', 'earring', 2, true),
  ('cat_ring', 'Ring', 'ring', 3, true),
  ('cat_bracelet', 'Bracelet', 'bracelet', 4, true),
  ('cat_anklet', 'Anklet', 'anklet', 5, true),
  ('cat_temple', 'Temple Jewellery', 'temple-jewellery', 6, true),
  ('cat_bangles', 'Bangles', 'bangles', 7, true),
  ('cat_antitarnish', 'Anti-Tarnish', 'anti-tarnish', 8, true),
  ('cat_customname', 'Customized Name', 'customized-name', 9, true)
ON CONFLICT (id) DO NOTHING;
