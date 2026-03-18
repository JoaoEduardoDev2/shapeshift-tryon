import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const { store_url, consumer_key, consumer_secret } = await req.json();
    if (!store_url || !consumer_key || !consumer_secret) {
      return new Response(JSON.stringify({ error: "store_url, consumer_key and consumer_secret are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const baseUrl = store_url.replace(/\/+$/, "");
    // Credentials MUST go in the Authorization header, not the URL,
    // to prevent them leaking into server access logs.
    const apiUrl = `${baseUrl}/wp-json/wc/v3/products?per_page=100`;
    const credentials = btoa(`${consumer_key}:${consumer_secret}`);
    console.log("[woocommerce-import] GET", apiUrl);
    const wcCtrl = new AbortController();
    const wcTimer = setTimeout(() => wcCtrl.abort(), 15000);
    let wcRes: Response;
    try {
      wcRes = await fetch(apiUrl, {
        signal: wcCtrl.signal,
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
      });
    } finally {
      clearTimeout(wcTimer);
    }
    if (!wcRes.ok) {
      const errText = await wcRes.text();
      console.error("[woocommerce-import] API error", wcRes.status, errText.slice(0, 200));
      return new Response(JSON.stringify({ error: `WooCommerce API error (${wcRes.status}): verifique a URL, Consumer Key e Consumer Secret`, details: errText.slice(0, 500) }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const products = await wcRes.json();
    console.log("[woocommerce-import] produtos encontrados:", products.length);
    const mapped = products.map((p: any) => ({
      user_id: userId,
      name: p.name || "Sem nome",
      description: (p.short_description || p.description || "").replace(/<[^>]*>/g, "").slice(0, 500) || null,
      category: mapCategory(p.categories?.[0]?.name || ""),
      image_url: p.images?.[0]?.src || null,
      price: p.price ? parseFloat(p.price) : null,
      sku: p.sku || null,
      is_active: p.status === "publish",
      original_url: p.permalink ?? null,
      import_type: "integration",

    let imported = 0, skipped = 0;
    for (const product of mapped) {
      if (product.sku) {
        const { data: existing } = await supabase.from("products").select("id").eq("user_id", userId).eq("sku", product.sku).maybeSingle();
        if (existing) { skipped++; continue; }
      }
      const { error: insertErr } = await supabase.from("products").insert(product);
      if (!insertErr) imported++; else skipped++;
    }

    await supabase.from("store_settings").upsert({ user_id: userId, platform: "woocommerce", platform_url: baseUrl, store_name: new URL(baseUrl).hostname }, { onConflict: "user_id" });

    return new Response(JSON.stringify({ success: true, total: products.length, imported, skipped }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("woocommerce-import error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function mapCategory(cat: string): string {
  const t = (cat || "").toLowerCase();
  if (t.includes("vestido") || t.includes("dress")) return "dresses";
  if (t.includes("calça") || t.includes("pant") || t.includes("jean") || t.includes("saia") || t.includes("skirt")) return "bottoms";
  if (t.includes("camisa") || t.includes("blusa") || t.includes("camiseta") || t.includes("shirt") || t.includes("top")) return "tops";
  if (t.includes("jaqueta") || t.includes("casaco") || t.includes("jacket") || t.includes("coat")) return "outerwear";
  return "tops";
}
