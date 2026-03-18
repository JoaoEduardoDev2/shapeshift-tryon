import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string | null;
  product_type: string;
  images: { src: string }[];
  variants: {
    price: string;
    sku: string | null;
  }[];
  tags: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { store_url, api_key } = await req.json();

    if (!store_url || !api_key) {
      return new Response(
        JSON.stringify({ error: "store_url and api_key are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize store URL to mystore.myshopify.com format
    let shopDomain = store_url
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .trim();

    if (!shopDomain.includes(".myshopify.com") && !shopDomain.includes(".")) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    // ── SSRF guard: reject non-public domains ──────────────────────────────
    if (!isSafeDomain(shopDomain)) {
      return new Response(JSON.stringify({ error: "Domínio inválido ou não permitido." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Fetch products from Shopify Admin API (15 s timeout) ───────────────
    const shopifyUrl = `https://${shopDomain}/admin/api/2024-01/products.json?limit=250`;
    console.log("[shopify-import] GET", shopifyUrl);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    let shopifyRes: Response;
    try {
      shopifyRes = await fetch(shopifyUrl, {
        signal: ctrl.signal,
        headers: {
          "X-Shopify-Access-Token": api_key,
          "Content-Type": "application/json",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!shopifyRes.ok) {
      const errText = await shopifyRes.text();
      return new Response(
        JSON.stringify({
          error: `Shopify API error (${shopifyRes.status})`,
          details: errText,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { products } = (await shopifyRes.json()) as { products: ShopifyProduct[] };

    // Map Shopify products to our schema
    const mapped = products.map((p) => ({
      user_id: userId,
      name: p.title,
      description: p.body_html?.replace(/<[^>]*>/g, "").slice(0, 500) || null,
      category: mapCategory(p.product_type),
      image_url: p.images?.[0]?.src || null,
      imported_images: (p.images ?? []).map((i) => i.src),
      price: p.variants?.[0]?.price ? parseFloat(p.variants[0].price) : null,
      sku: p.variants?.[0]?.sku || null,
      sizes: [...new Set((p.variants ?? []).map((v: any) => v.option1).filter(Boolean))],
      is_active: true,
      original_url: `https://${shopDomain}/products/${(p as any).handle ?? ""}`,
      import_type: "integration",
    }));

    // Upsert products (by SKU to avoid duplicates)
    let imported = 0;
    let skipped = 0;

    for (const product of mapped) {
      if (product.sku) {
        // Check if SKU already exists for this user
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("user_id", userId)
          .eq("sku", product.sku)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }
      }

      const { error: insertErr } = await supabase.from("products").insert(product);
      if (!insertErr) imported++;
      else skipped++;
    }

    // Save store connection info
    await supabase
      .from("store_settings")
      .upsert(
        {
          user_id: userId,
          platform: "shopify",
          platform_url: `https://${shopDomain}`,
          store_name: shopDomain.split(".")[0],
        },
        { onConflict: "user_id" }
      );

    return new Response(
      JSON.stringify({
        success: true,
        total: products.length,
        imported,
        skipped,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("shopify-import error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function mapCategory(shopifyType: string): string {
  const t = (shopifyType || "").toLowerCase();
  if (t.includes("dress") || t.includes("vestido")) return "dresses";
  if (t.includes("pant") || t.includes("calça") || t.includes("jean")) return "bottoms";
  if (t.includes("shirt") || t.includes("camisa") || t.includes("blouse") || t.includes("top")) return "tops";
  if (t.includes("jacket") || t.includes("coat") || t.includes("jaqueta")) return "outerwear";
  if (t.includes("skirt") || t.includes("saia")) return "bottoms";
  return "tops";
}

/** Reject localhost and RFC-1918 addresses to prevent SSRF. */
function isSafeDomain(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h === "::1") return false;
  if (/^127\./.test(h) || /^10\./.test(h)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  if (/^192\.168\./.test(h)) return false;
  if (/^169\.254\./.test(h)) return false;
  return true;
}
