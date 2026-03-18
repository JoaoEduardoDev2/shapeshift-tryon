import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[SCRAPE-PRODUCT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Scraping URL", { url });

    // ── Security: block SSRF — reject localhost and private IP ranges ──────────
    if (!isUrlSafe(url)) {
      return new Response(JSON.stringify({ success: false, error: "URL inválida ou não permitida." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Strategy 1: Shopify JSON API (most reliable for Shopify stores) ────────
    const shopifyData = await tryShopifyApi(url);
    if (shopifyData?.name) {
      logStep("Shopify API success", { name: shopifyData.name, images: shopifyData.images?.length });
      return new Response(JSON.stringify({ success: true, product: shopifyData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Strategy 2: HTML scraping with 12 s timeout ─────────────────────────
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 12000);
    let html: string;
    try {
      const pageRes = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
      });
      if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status} ao buscar a página`);
      html = await pageRes.text();
    } finally {
      clearTimeout(fetchTimeout);
    }

    logStep("Page fetched", { length: html.length });

    // Extract structured data from HTML using meta tags and JSON-LD
    const extracted = extractProductData(html, url);
    logStep("Extracted data", extracted);

    // ── Strategy 3: AI extraction when HTML parsing yields no name ────────────
    if (!extracted.name) {
      const aiResult = await extractWithAI(html, url);
      if (aiResult) {
        Object.assign(extracted, aiResult);
      }
    }

    // All strategies exhausted — return clear error instead of empty product
    if (!extracted.name) {
      return new Response(JSON.stringify({
        success: false,
        error: "Não foi possível extrair dados do produto. A loja pode usar JavaScript para renderizar o conteúdo. Tente copiar os dados manualmente.",
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      product: extracted,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── SSRF guard: reject localhost and private IP ranges ─────────────────────
function isUrlSafe(rawUrl: string): boolean {
  let u: URL;
  try { u = new URL(rawUrl); } catch { return false; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h === "::1" || h === "0.0.0.0") return false;
  if (/^127\./.test(h)) return false;
  if (/^10\./.test(h)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  if (/^192\.168\./.test(h)) return false;
  if (/^169\.254\./.test(h)) return false; // AWS metadata
  return true;
}

// ── Shopify JSON product API ─────────────────────────────────────────────────
// Shopify stores expose /products/{handle}.json — far more reliable than HTML
async function tryShopifyApi(url: string): Promise<Record<string, any> | null> {
  try {
    const u = new URL(url);
    const isShopify =
      u.hostname.includes("myshopify.com") ||
      u.pathname.startsWith("/products/");
    if (!isShopify) return null;
    const cleanPath = u.pathname.replace(/\/$/, "").split("?")[0];
    if (!cleanPath.startsWith("/products/")) return null;
    const jsonUrl = `${u.origin}${cleanPath}.json`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(jsonUrl, {
      signal: ctrl.signal,
      headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    const p = data.product;
    if (!p?.title) return null;
    const images: string[] = (p.images ?? []).map((i: any) => i.src).filter(Boolean);
    const variants: any[] = p.variants ?? [];
    const prices = variants.map((v: any) => parseFloat(v.price)).filter(Number.isFinite);
    const sizes: string[] = [
      ...new Set<string>(
        variants.flatMap((v: any) => {
          const opts: string[] = [];
          if (v.option1 && v.option1 !== "Default Title") opts.push(v.option1);
          if (v.option2) opts.push(v.option2);
          return opts;
        }),
      ),
    ];
    return {
      name: p.title,
      description: (p.body_html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      price: prices.length ? Math.min(...prices) : null,
      images,
      category: p.product_type ?? "",
      sizes,
      colors: [],
      platform: "shopify",
      original_url: url,
    };
  } catch {
    return null;
  }
}

// ── og: meta tag extraction — handles both attribute orders ──────────────────
// Some sites put content="..." before property="..." and vice-versa
function extractOgContent(html: string, property: string): string | null {
  const re1 = new RegExp(`<meta[^>]*property="${property}"[^>]*content="([^"]*)"`, "i");
  const re2 = new RegExp(`<meta[^>]*content="([^"]*)"[^>]*property="${property}"`, "i");
  const m = html.match(re1) || html.match(re2);
  return m ? m[1] : null;
}

// ── Resolve relative URLs against a base ────────────────────────────────────
function absoluteUrl(src: string, base: string): string {
  try { return new URL(src, base).href; } catch { return src; }
}

function extractProductData(html: string, sourceUrl: string) {
  const result: Record<string, any> = {
    name: "",
    description: "",
    price: null,
    images: [] as string[],
    category: "",
    sizes: [] as string[],
    colors: [] as string[],
    original_url: sourceUrl,
  };

  // 1. Try JSON-LD (most reliable)
  const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const content = match.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
        const data = JSON.parse(content);
        const product = data["@type"] === "Product" ? data : data["@graph"]?.find?.((i: any) => i["@type"] === "Product");
        if (product) {
          result.name = product.name || result.name;
          result.description = product.description || result.description;
          if (product.image) {
            const imgs = Array.isArray(product.image) ? product.image : [product.image];
            result.images = imgs.map((i: any) => typeof i === "string" ? i : i?.url || i?.contentUrl).filter(Boolean);
          }
          if (product.offers) {
            const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
            result.price = parseFloat(offer?.price) || null;
          }
          if (product.category) {
            result.category = typeof product.category === "string" ? product.category : "";
          }
          break;
        }
      } catch { /* ignore parse errors */ }
    }
  }

  // 2. Fallback to Open Graph meta tags (handles both attribute orders)
  if (!result.name) {
    const v = extractOgContent(html, "og:title");
    if (v) result.name = decodeHtmlEntities(v);
  }
  if (!result.description) {
    const v = extractOgContent(html, "og:description");
    if (v) result.description = decodeHtmlEntities(v);
  }
  if (result.images.length === 0) {
    const v = extractOgContent(html, "og:image");
    if (v) result.images.push(absoluteUrl(v, sourceUrl));
  }
  if (result.price === null) {
    const v = extractOgContent(html, "product:price:amount");
    if (v) result.price = parseFloat(v) || null;
  }

  // 3. Fallback to standard meta tags
  if (!result.name) {
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleTag) result.name = decodeHtmlEntities(titleTag[1]).split("|")[0].split("-")[0].trim();
  }

  // 4. Extract additional images — absolute AND relative src attributes
  const imgMatches = html.matchAll(/<img[^>]*src="([^"]*(?:product|image|foto|img)[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/gi);
  for (const m of imgMatches) {
    const abs = absoluteUrl(m[1], sourceUrl);
    if (result.images.length < 8 && !result.images.includes(abs)) {
      result.images.push(abs);
    }
  }
  // 4b. Lazy-loaded images via data-src or srcset (common in Nuvemshop / WooCommerce)
  const lazyMatches = html.matchAll(/(?:data-src|srcset)="(https?:\/\/[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/gi);
  for (const m of lazyMatches) {
    const src = m[1].split(/[\s,]/)[0];
    if (result.images.length < 8 && src && !result.images.includes(src)) {
      result.images.push(src);
    }
  }

  // 5. Try to detect platform
  result.platform = detectPlatform(html, sourceUrl);

  return result;
}

function detectPlatform(html: string, url: string): string {
  if (html.includes("Shopify") || url.includes("myshopify.com")) return "shopify";
  if (html.includes("nuvemshop") || html.includes("lojanuvem") || url.includes("lojanuvem")) return "nuvemshop";
  if (html.includes("tray.com") || html.includes("traycorp")) return "tray";
  if (html.includes("woocommerce") || html.includes("wp-content")) return "woocommerce";
  if (html.includes("vtex") || url.includes("vtexcommercestable")) return "vtex";
  return "unknown";
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .trim();
}

async function extractWithAI(html: string, url: string): Promise<Record<string, any> | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;

  try {
    // Trim HTML to relevant product content (~8k chars)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const body = bodyMatch ? bodyMatch[1] : html;
    const cleaned = body
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);

    const res = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You extract product info from e-commerce pages. Return ONLY valid JSON with keys: name, description, price (number or null), category (string), sizes (array of strings), colors (array of strings). No markdown."
          },
          {
            role: "user",
            content: `Extract product data from this e-commerce page (${url}):\n\n${cleaned}`
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    // AI extraction failed, continue with what we have
  }
  return null;
}
