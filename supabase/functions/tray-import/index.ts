import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { api_url, access_token } = await req.json();

    if (!api_url || !access_token) {
      return new Response(
        JSON.stringify({ error: "api_url and access_token are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize Tray API URL
    const baseUrl = api_url.replace(/\/+$/, "");

    // Fetch products from Tray API
    const trayRes = await fetch(`${baseUrl}/products?access_token=${access_token}&limit=200`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!trayRes.ok) {
      const errText = await trayRes.text();
      return new Response(
        JSON.stringify({ error: `Tray API error (${trayRes.status})`, details: errText }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trayData = await trayRes.json();
    const products = trayData.Products || [];

    const mapped = products.map((wrapper: any) => {
      const p = wrapper.Product || wrapper;
      return {
        user_id: userId,
        name: p.name || p.product_name || "Sem nome",
        description: (p.description || "")?.replace(/<[^>]*>/g, "").slice(0, 500) || null,
        category: mapCategory(p.category_name || ""),
        image_url: p.image?.https || p.ProductImage?.[0]?.https || null,
        price: p.price ? parseFloat(p.price) : null,
        sku: p.reference || p.sku || null,
        is_active: p.available === "1" || p.available === 1,
      };
    });

    let imported = 0;
    let skipped = 0;

    for (const product of mapped) {
      if (product.sku) {
        const { data: existing } = await supabase
          .from("products").select("id").eq("user_id", userId).eq("sku", product.sku).maybeSingle();
        if (existing) { skipped++; continue; }
      }
      const { error: insertErr } = await supabase.from("products").insert(product);
      if (!insertErr) imported++; else skipped++;
    }

    await supabase.from("store_settings").upsert(
      { user_id: userId, platform: "tray", platform_url: baseUrl, store_name: `tray-store` },
      { onConflict: "user_id" }
    );

    return new Response(
      JSON.stringify({ success: true, total: products.length, imported, skipped }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("tray-import error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
