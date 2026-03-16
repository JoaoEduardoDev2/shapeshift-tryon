
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS tryon_mode text NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS makeup_type text NULL,
  ADD COLUMN IF NOT EXISTS color_hex text NULL,
  ADD COLUMN IF NOT EXISTS color_rgb text NULL,
  ADD COLUMN IF NOT EXISTS color_tone text NULL,
  ADD COLUMN IF NOT EXISTS skin_tone text NULL,
  ADD COLUMN IF NOT EXISTS undertone text NULL,
  ADD COLUMN IF NOT EXISTS finish text NULL;
