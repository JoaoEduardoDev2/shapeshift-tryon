import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * TikTok Shop API v202309 HMAC-SHA256 request signature.
 *
 * Algorithm (official docs):
 *   1. Collect all query-string params EXCEPT "sign" and "access_token".
 *   2. Sort those params alphabetically by key.
 *   3. Build: path + key1 + val1 + key2 + val2 + ... + body_json
 *   4. Wrap with secret: app_secret + above + app_secret
 *   5. sign = HMAC-SHA256(key=app_secret, data=wrapped).hex().toUpperCase()
 */
async function computeTTSSign(
  appSecret: string,
  path: string,
  params: Record<string, string>,
  body: string,
): Promise<string> {
  const excluded = new Set(["sign", "access_token"]);
  const sortedKeys = Object.keys(params).filter((k) => !excluded.has(k)).sort();

  let base = path;
  for (const key of sortedKeys) base += key + params[key];
  if (body && body !== "{}") base += body;

  const input = appSecret + base + appSecret;

  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(input));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // app_key + app_secret → from TikTok Shop Partner Center → App Management.
    // access_token         → OAuth2 access token obtained for the seller shop.
    const { app_key, app_secret, access_token, shop_cipher } = await req.json();
    if (!app_key || !app_secret || !access_token) {
      return new Response(
        JSON.stringify({ error: "app_key, app_secret and access_token are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── TikTok Shop API v202309 — search products ──────────────────────────
    const path = "/product/202309/products/search";
    const baseUrl = "https://open-api.tiktokshop.com";
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({ page_size: 100 });

    const params: Record<string, string> = {
      app_key,
      timestamp: String(timestamp),
    };
    if (shop_cipher) params.shop_cipher = shop_cipher;

    const sign = await computeTTSSign(app_secret, path, params, body);
    params.sign = sign;

    const queryStr = new URLSearchParams(params).toString();
    const apiUrl = `${baseUrl}${path}?${queryStr}`;

    console.log("[tiktok-shop-import] POST", path, "ts:", timestamp);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    let ttsRes: Response;
    try {
      ttsRes = await fetch(apiUrl, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          "x-tts-access-token": access_token,
        },
        body,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      console.error("[tiktok-shop-import] HTTP error", ttsRes.status, errText.slice(0, 300));
      return new Response(
        JSON.stringify({
          error: `TikTok Shop API error (${ttsRes.status}): verifique o App Key, App Secret e Access Token`,
          details: errText.slice(0, 500),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ttsData = await ttsRes.json();
    if (ttsData.code !== 0 && ttsData.code !== undefined) {
      console.error("[tiktok-shop-import] API error code", ttsData.code, ttsData.message);
      return new Response(
        JSON.stringify({
          error: `TikTok Shop erro ${ttsData.code}: ${ttsData.message || "Unknown"}`,
          details: JSON.stringify(ttsData),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const products = ttsData.data?.products || [];
    console.log("[tiktok-shop-import] produtos encontrados:", products.length);

    const mapped = products.map((p: any) => ({
      user_id: userId,
      name: p.product_name || p.title || "Sem nome",
      description: (p.description || "").replace(/<[^>]*>/g, "").slice(0, 500) || null,
      category: mapCategory(p.category_list?.[0]?.local_display_name || ""),
      image_url: p.main_images?.[0]?.url_list?.[0] || null,
      // TikTok returns prices in minor units (cents) — divide by 100.
      price: p.skus?.[0]?.price?.sale_price
        ? parseFloat(p.skus[0].price.sale_price) / 100
        : null,
      sku: p.skus?.[0]?.seller_sku || null,
      is_active: p.product_status === 4, // 4 = LIVE
      import_type: "integration",
    }));

    let imported = 0;
    let skipped = 0;
    for (const product of mapped) {
      if (product.sku) {
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("user_id", userId)
          .eq("sku", product.sku)
          .maybeSingle();
        if (existing) { skipped++; continue; }
      }
      const { error: insertErr } = await supabase.from("products").insert(product);
      if (!insertErr) imported++;
      else {
        console.warn("[tiktok-shop-import] insert error:", insertErr.message);
        skipped++;
      }
    }

    await supabase.from("store_settings").upsert(
      { user_id: userId, platform: "tiktok_shop", platform_url: "https://seller.tiktokshop.com", store_name: "tiktok-shop" },
      { onConflict: "user_id" },
    );

    console.log("[tiktok-shop-import] done — imported:", imported, "skipped:", skipped);
    return new Response(
      JSON.stringify({ success: true, total: products.length, imported, skipped }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[tiktok-shop-import] unhandled error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
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
