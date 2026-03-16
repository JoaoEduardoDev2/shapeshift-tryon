

## Analysis: Features Already Implemented

After reviewing the codebase, **all the features you described are already implemented** from a previous iteration. Here's what exists:

### Already Working
- **`tryon_mode`** column in `products` table with values `photo`, `mirror`, `both`
- **ProductFormDialog**: has "Tipo de Provador" selector with 3 options and smart defaults per category
- **ProductCard**: routes to `/photo`, `/mirror`, or shows choice dialog based on `tryon_mode`
- **Makeup fields**: `makeup_type`, `color_hex`, `color_rgb`, `color_tone`, `skin_tone`, `undertone`, `finish` all exist in DB and form
- **AI color detection**: `detect-color` edge function uses Gemini via Lovable AI with tool calling
- **Category-based defaults**: eyewear/makeup → mirror, shoes → photo, others → both
- **Try-on mode icons**: 📷🎥🔄 shown on product cards

### Improvements to Make

Since everything is already built, here are meaningful enhancements:

1. **Add product editing** — Currently only create + delete exist. Add an edit dialog so lojistas can update products without recreating them.

2. **Pass product data to try-on pages** — The "Provar" button navigates to `/photo` or `/mirror` but doesn't pass the product ID or color data, so the try-on page can't use the registered product colors.

3. **Opacity/intensity slider for makeup** — Add an `intensity` field (0-100) to the product form so lojistas can set default opacity for makeup simulation.

4. **Bulk actions** — Enable selecting multiple products to activate/deactivate or change tryon_mode in batch.

### Plan

| Step | What | Files |
|------|-------|-------|
| 1 | **Create EditProductDialog** — Reuse form fields from ProductFormDialog in an edit variant that loads existing product data and calls `UPDATE` | `src/components/admin/EditProductDialog.tsx` |
| 2 | **Update ProductCard** — Add edit button, pass product ID as query param when navigating to try-on pages (`/mirror?product=ID`) | `src/components/admin/ProductCard.tsx` |
| 3 | **Add intensity field** — Add `intensity` column (integer, default 80) to products table; add slider in makeup section of form | Migration + `ProductFormDialog.tsx` |
| 4 | **Mirror page integration** — Read `?product=` query param in Mirror page, fetch product's `color_hex` and `makeup_type`, apply as default selection | `src/pages/Mirror.tsx` |

No database schema changes are needed for steps 1-2. Step 3 requires one small migration.

