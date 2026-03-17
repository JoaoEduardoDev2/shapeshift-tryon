import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ImportedProduct {
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  images: string[];
  category: string;
  sizes: string[];
  colors: string[];
  sku: string | null;
  original_url: string | null;
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

    const { platform, store_url, api_key, scrape_url } = await req.json();

    let products: ImportedProduct[] = [];
    let importType = "manual";

    if (platform === "shopify" && store_url && api_key) {
      products = await importShopify(store_url, api_key);
      importType = "api";
    } else if (platform === "nuvemshop" && store_url && api_key) {
      products = await importNuvemshop(store_url, api_key);
      importType = "api";
    } else if (platform === "woocommerce" && store_url && api_key) {
      products = await importWooCommerce(store_url, api_key);
      importType = "api";
    } else if (platform === "vtex" && store_url && api_key) {
      products = await importVTEX(store_url, api_key);
      importType = "api";
    } else if (platform === "tray" && store_url && api_key) {
      products = await importTray(store_url, api_key);
      importType = "api";
    } else if (scrape_url) {
      products = await importViaScraping(scrape_url);
      importType = "scraping";
    } else {
      return new Response(
        JSON.stringify({ error: "Informe plataforma + credenciais ou URL para scraping" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save store settings
    if (platform && store_url) {
      await supabase.from("store_settings").upsert(
        {
          user_id: userId,
          platform,
          platform_url: store_url,
          store_name: new URL(store_url.startsWith("http") ? store_url : `https://${store_url}`).hostname.split(".")[0],
        },
        { onConflict: "user_id" }
      );
    }

    // Insert products as drafts
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const p of products) {
      // Skip duplicates by name + user
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("user_id", userId)
        .eq("name", p.name)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const mappedCategory = mapCategory(p.category);
      const { error: insertErr } = await supabase.from("products").insert({
        user_id: userId,
        name: p.name,
        description: p.description,
        category: mappedCategory,
        price: p.price,
        image_url: p.image_url || p.images?.[0] || null,
        sku: p.sku,
        sizes: p.sizes || [],
        colors: p.colors || [],
        original_url: p.original_url,
        imported_images: p.images || [],
        custom_images: [],
        sync_enabled: false,
        status: "draft",
        import_type: importType,
        quality_score: null,
        tryon_mode: mappedCategory === "eyewear" || mappedCategory === "makeup" ? "mirror" : "both",
      });

      if (insertErr) {
        errors.push(`${p.name}: ${insertErr.message}`);
        skipped++;
      } else {
        imported++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: products.length,
        imported,
        skipped,
        errors: errors.slice(0, 10),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("bulk-import error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── Platform importers ───

async function importShopify(storeUrl: string, apiKey: string): Promise<ImportedProduct[]> {
  let domain = storeUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
  if (!domain.includes(".myshopify.com") && !domain.includes(".")) {
    domain = `${domain}.myshopify.com`;
  }

  const allProducts: ImportedProduct[] = [];
  let pageInfo: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const url = pageInfo
      ? `https://${domain}/admin/api/2024-01/products.json?limit=250&page_info=${pageInfo}`
      : `https://${domain}/admin/api/2024-01/products.json?limit=250`;

    const res = await fetch(url, {
      headers: { "X-Shopify-Access-Token": apiKey, "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Shopify API error (${res.status}): ${text}`);
    }

    const { products } = await res.json();
    for (const p of products) {
      const sizes: string[] = [];
      const colors: string[] = [];
      for (const v of p.variants || []) {
        if (v.option1 && !sizes.includes(v.option1)) sizes.push(v.option1);
        if (v.option2 && !colors.includes(v.option2)) colors.push(v.option2);
      }
      allProducts.push({
        name: p.title,
        description: p.body_html?.replace(/<[^>]*>/g, "").slice(0, 500) || null,
        price: p.variants?.[0]?.price ? parseFloat(p.variants[0].price) : null,
        image_url: p.images?.[0]?.src || null,
        images: (p.images || []).map((i: any) => i.src),
        category: p.product_type || "",
        sizes,
        colors,
        sku: p.variants?.[0]?.sku || null,
        original_url: `https://${domain}/products/${p.handle}`,
      });
    }

    // Pagination via Link header
    const linkHeader = res.headers.get("link") || "";
    const nextMatch = linkHeader.match(/<[^>]*page_info=([^>&]+)[^>]*>;\s*rel="next"/);
    if (nextMatch) {
      pageInfo = nextMatch[1];
    } else {
      hasNext = false;
    }
  }

  return allProducts;
}

async function importNuvemshop(storeUrl: string, apiKey: string): Promise<ImportedProduct[]> {
  const storeId = storeUrl.replace(/\D/g, "") || storeUrl;
  const res = await fetch(`https://api.nuvemshop.com.br/v1/${storeId}/products?per_page=200`, {
    headers: { Authentication: `bearer ${apiKey}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Nuvemshop API error (${res.status})`);
  const products = await res.json();
  return products.map((p: any) => ({
    name: p.name?.pt || p.name?.es || Object.values(p.name || {})[0] || "Sem nome",
    description: (p.description?.pt || "").replace(/<[^>]*>/g, "").slice(0, 500),
    price: p.variants?.[0]?.price ? parseFloat(p.variants[0].price) : null,
    image_url: p.images?.[0]?.src || null,
    images: (p.images || []).map((i: any) => i.src),
    category: p.categories?.[0]?.name?.pt || "",
    sizes: (p.variants || []).map((v: any) => v.values?.find((val: any) => val.pt)?.pt).filter(Boolean),
    colors: [],
    sku: p.variants?.[0]?.sku || null,
    original_url: p.canonical_url || null,
  }));
}

async function importWooCommerce(storeUrl: string, apiKey: string): Promise<ImportedProduct[]> {
  const base = storeUrl.replace(/\/+$/, "");
  // api_key format: consumer_key:consumer_secret
  const [ck, cs] = apiKey.split(":");
  const auth = btoa(`${ck}:${cs}`);
  const res = await fetch(`${base}/wp-json/wc/v3/products?per_page=100`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`WooCommerce API error (${res.status})`);
  const products = await res.json();
  return products.map((p: any) => ({
    name: p.name,
    description: (p.short_description || p.description || "").replace(/<[^>]*>/g, "").slice(0, 500),
    price: p.price ? parseFloat(p.price) : null,
    image_url: p.images?.[0]?.src || null,
    images: (p.images || []).map((i: any) => i.src),
    category: p.categories?.[0]?.name || "",
    sizes: [],
    colors: [],
    sku: p.sku || null,
    original_url: p.permalink || null,
  }));
}

async function importVTEX(storeUrl: string, apiKey: string): Promise<ImportedProduct[]> {
  const base = storeUrl.replace(/\/+$/, "");
  const [appKey, appToken] = apiKey.split(":");
  const res = await fetch(`${base}/api/catalog_system/pub/products/search?_from=0&_to=49`, {
    headers: {
      "X-VTEX-API-AppKey": appKey,
      "X-VTEX-API-AppToken": appToken,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`VTEX API error (${res.status})`);
  const products = await res.json();
  return products.map((p: any) => ({
    name: p.productName,
    description: (p.description || "").replace(/<[^>]*>/g, "").slice(0, 500),
    price: p.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || null,
    image_url: p.items?.[0]?.images?.[0]?.imageUrl || null,
    images: (p.items?.[0]?.images || []).map((i: any) => i.imageUrl),
    category: p.categories?.[0] || "",
    sizes: [],
    colors: [],
    sku: p.items?.[0]?.itemId || null,
    original_url: p.link || null,
  }));
}

async function importTray(storeUrl: string, apiKey: string): Promise<ImportedProduct[]> {
  const base = storeUrl.replace(/\/+$/, "");
  const res = await fetch(`${base}/web_api/products?access_token=${apiKey}&limit=50`);
  if (!res.ok) throw new Error(`Tray API error (${res.status})`);
  const data = await res.json();
  const products = data.Products || [];
  return products.map((wrapper: any) => {
    const p = wrapper.Product || wrapper;
    return {
      name: p.name || p.title || "Sem nome",
      description: (p.description || "").replace(/<[^>]*>/g, "").slice(0, 500),
      price: p.price ? parseFloat(p.price) : null,
      image_url: p.ProductImage?.[0]?.https || null,
      images: (p.ProductImage || []).map((i: any) => i.https).filter(Boolean),
      category: p.category || "",
      sizes: [],
      colors: [],
      sku: p.reference || p.sku || null,
      original_url: p.url?.https || null,
    };
  });
}

async function importViaScraping(storeUrl: string): Promise<ImportedProduct[]> {
  // Fetch the store's main page/sitemap to find product links
  const base = storeUrl.replace(/\/+$/, "");
  const products: ImportedProduct[] = [];

  try {
    // Try sitemap first
    const sitemapRes = await fetch(`${base}/sitemap.xml`);
    let productUrls: string[] = [];

    if (sitemapRes.ok) {
      const sitemapText = await sitemapRes.text();
      const urlMatches = sitemapText.match(/<loc>(.*?)<\/loc>/g) || [];
      productUrls = urlMatches
        .map((m) => m.replace(/<\/?loc>/g, ""))
        .filter((u) => u.includes("/product") || u.includes("/produto") || u.includes("/p/"))
        .slice(0, 50);
    }

    // Fallback: try common product listing pages
    if (productUrls.length === 0) {
      const pageRes = await fetch(base);
      if (pageRes.ok) {
        const html = await pageRes.text();
        const hrefMatches = html.match(/href="([^"]*(?:\/product|\/produto|\/p\/)[^"]*)"/g) || [];
        productUrls = hrefMatches
          .map((m) => {
            const url = m.replace(/href="/, "").replace(/"$/, "");
            return url.startsWith("http") ? url : `${base}${url.startsWith("/") ? "" : "/"}${url}`;
          })
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 30);
      }
    }

    // Scrape each product URL
    for (const url of productUrls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const html = await res.text();

        // Extract via JSON-LD
        const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
        if (jsonLdMatch) {
          try {
            const ld = JSON.parse(jsonLdMatch[1]);
            const item = ld["@type"] === "Product" ? ld : (Array.isArray(ld["@graph"]) ? ld["@graph"].find((g: any) => g["@type"] === "Product") : null);
            if (item) {
              products.push({
                name: item.name || "Sem nome",
                description: (item.description || "").slice(0, 500),
                price: item.offers?.price ? parseFloat(item.offers.price) : null,
                image_url: Array.isArray(item.image) ? item.image[0] : item.image || null,
                images: Array.isArray(item.image) ? item.image : item.image ? [item.image] : [],
                category: item.category || "",
                sizes: [],
                colors: [],
                sku: item.sku || null,
                original_url: url,
              });
              continue;
            }
          } catch {}
        }

        // Fallback: OG meta tags
        const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)?.[1];
        const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)?.[1];
        if (ogTitle) {
          products.push({
            name: ogTitle,
            description: html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i)?.[1]?.slice(0, 500) || null,
            price: null,
            image_url: ogImage || null,
            images: ogImage ? [ogImage] : [],
            category: "",
            sizes: [],
            colors: [],
            sku: null,
            original_url: url,
          });
        }
      } catch {
        // Skip individual product errors
      }
    }
  } catch (e) {
    console.error("Scraping error:", e);
  }

  return products;
}

function mapCategory(cat: string): string {
  const t = (cat || "").toLowerCase();
  if (t.includes("dress") || t.includes("vestido")) return "dresses";
  if (t.includes("pant") || t.includes("calça") || t.includes("jean") || t.includes("short") || t.includes("saia") || t.includes("skirt")) return "bottoms";
  if (t.includes("shirt") || t.includes("camis") || t.includes("blous") || t.includes("blusa") || t.includes("top") || t.includes("camiseta")) return "tops";
  if (t.includes("jacket") || t.includes("coat") || t.includes("jaqueta") || t.includes("casaco")) return "outerwear";
  if (t.includes("óculos") || t.includes("glasses") || t.includes("sunglasses")) return "eyewear";
  if (t.includes("sapato") || t.includes("tênis") || t.includes("shoe") || t.includes("boot")) return "shoes";
  if (t.includes("maquiagem") || t.includes("makeup") || t.includes("batom") || t.includes("cosmetic")) return "makeup";
  return "tops";
}
