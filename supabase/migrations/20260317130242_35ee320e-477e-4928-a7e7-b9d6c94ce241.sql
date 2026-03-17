
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS import_type text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS quality_score text DEFAULT null;
