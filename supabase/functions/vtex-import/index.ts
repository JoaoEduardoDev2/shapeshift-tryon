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

    const { account_name, app_key, app_token } = await req.json();
    if (!account_name || !app_key || !app_token) {
      return new Response(JSON.stringify({ error: "account_name, app_key and app_token are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const domain = account_name.includes(".") ? account_name : `${account_name}.vtexcommercestable.com.br`;
    const apiUrl = `https://${domain}/api/catalog_system/pub/products/search?_from=0&_to=249`;
    console.log("[vtex-import] GET", apiUrl);
    const vtexCtrl = new AbortController();
    const vtexTimer = setTimeout(() => vtexCtrl.abort(), 15000);
    let vtexRes: Response;
    try {
      vtexRes = await fetch(apiUrl, {
        signal: vtexCtrl.signal,
        headers: {
          "X-VTEX-API-AppKey": app_key,
          "X-VTEX-API-AppToken": app_token,
          "Content-Type": "application/json",
        },
      });
    } finally {
      clearTimeout(vtexTimer);
    }

    if (!vtexRes.ok) {
      const errText = await vtexRes.text();
      console.error("[vtex-import] API error", vtexRes.status, errText.slice(0, 200));
      return new Response(JSON.stringify({ error: `VTEX API error (${vtexRes.status}): verifique o account name, App Key e App Token`, details: errText.slice(0, 500) }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const products = await vtexRes.json();
    console.log("[vtex-import] produtos encontrados:", products.length);
    const mapped = products.map((p: any) => ({
      user_id: userId,
      name: p.productName || p.nameComplete || "Sem nome",
      description: (p.description || "").replace(/<[^>]*>/g, "").slice(0, 500) || null,
      category: mapCategory(p.categories?.[0] || ""),
      image_url: p.items?.[0]?.images?.[0]?.imageUrl || null,
      price: p.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || null,
      sku: p.items?.[0]?.referenceId?.[0]?.Value || p.productReference || null,
      is_active: p.isActive ?? true,
      original_url: p.link ?? null,
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

    await supabase.from("store_settings").upsert({ user_id: userId, platform: "vtex", platform_url: `https://${domain}`, store_name: account_name.split(".")[0] }, { onConflict: "user_id" });

    return new Response(JSON.stringify({ success: true, total: products.length, imported, skipped }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("vtex-import error:", err);
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
