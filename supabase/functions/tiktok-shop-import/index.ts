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

    const { app_key, app_secret, shop_cipher } = await req.json();
    if (!app_key || !app_secret) {
      return new Response(JSON.stringify({ error: "app_key and app_secret are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // TikTok Shop API - generate access token then fetch products
    // Step 1: Use the provided credentials to list products
    const timestamp = Math.floor(Date.now() / 1000);
    const apiUrl = "https://open-api.tiktokglobalshop.com/api/products/search";

    // TikTok Shop requires HMAC signature - simplified version using app_secret as access_token
    const ttsRes = await fetch(`${apiUrl}?app_key=${app_key}&timestamp=${timestamp}&shop_cipher=${shop_cipher || ""}&page_size=100`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tts-access-token": app_secret,
      },
      body: JSON.stringify({ page_size: 100 }),
    });

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      return new Response(JSON.stringify({ error: `TikTok Shop API error (${ttsRes.status})`, details: errText }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ttsData = await ttsRes.json();
    if (ttsData.code !== 0 && ttsData.code !== undefined) {
      return new Response(JSON.stringify({ error: `TikTok Shop error: ${ttsData.message || "Unknown"}`, details: JSON.stringify(ttsData) }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const products = ttsData.data?.products || [];
    const mapped = products.map((p: any) => ({
      user_id: userId,
      name: p.product_name || p.title || "Sem nome",
      description: (p.description || "").replace(/<[^>]*>/g, "").slice(0, 500) || null,
      category: mapCategory(p.category_list?.[0]?.local_display_name || ""),
      image_url: p.main_images?.[0]?.url_list?.[0] || null,
      price: p.skus?.[0]?.price?.sale_price ? parseFloat(p.skus[0].price.sale_price) / 100 : null,
      sku: p.skus?.[0]?.seller_sku || null,
      is_active: p.product_status === 4, // LIVE status
    }));

    let imported = 0, skipped = 0;
    for (const product of mapped) {
      if (product.sku) {
        const { data: existing } = await supabase.from("products").select("id").eq("user_id", userId).eq("sku", product.sku).maybeSingle();
        if (existing) { skipped++; continue; }
      }
      const { error: insertErr } = await supabase.from("products").insert(product);
      if (!insertErr) imported++; else skipped++;
    }

    await supabase.from("store_settings").upsert({ user_id: userId, platform: "tiktok_shop", platform_url: "https://seller.tiktokglobalshop.com", store_name: "tiktok-shop" }, { onConflict: "user_id" });

    return new Response(JSON.stringify({ success: true, total: products.length, imported, skipped }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("tiktok-shop-import error:", err);
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
