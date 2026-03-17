
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS original_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS imported_images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sync_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' NOT NULL;
