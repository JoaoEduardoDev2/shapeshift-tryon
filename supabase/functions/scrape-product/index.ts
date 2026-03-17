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

    // Fetch the page HTML
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });

    if (!pageRes.ok) {
      throw new Error(`Failed to fetch page: ${pageRes.status}`);
    }

    const html = await pageRes.text();
    logStep("Page fetched", { length: html.length });

    // Extract structured data from HTML using meta tags and JSON-LD
    const extracted = extractProductData(html, url);
    logStep("Extracted data", extracted);

    // If we couldn't extract enough, use AI to parse
    if (!extracted.name) {
      const aiResult = await extractWithAI(html, url);
      if (aiResult) {
        Object.assign(extracted, aiResult);
      }
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

  // 2. Fallback to Open Graph meta tags
  if (!result.name) {
    const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
    if (ogTitle) result.name = decodeHtmlEntities(ogTitle[1]);
  }
  if (!result.description) {
    const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i);
    if (ogDesc) result.description = decodeHtmlEntities(ogDesc[1]);
  }
  if (result.images.length === 0) {
    const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
    if (ogImage) result.images.push(ogImage[1]);
  }
  if (result.price === null) {
    const ogPrice = html.match(/<meta[^>]*property="product:price:amount"[^>]*content="([^"]*)"[^>]*>/i);
    if (ogPrice) result.price = parseFloat(ogPrice[1]) || null;
  }

  // 3. Fallback to standard meta tags
  if (!result.name) {
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleTag) result.name = decodeHtmlEntities(titleTag[1]).split("|")[0].split("-")[0].trim();
  }

  // 4. Extract additional images from product galleries
  const imgMatches = html.matchAll(/<img[^>]*src="(https?:\/\/[^"]*(?:product|image|foto|img)[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi);
  for (const m of imgMatches) {
    if (result.images.length < 8 && !result.images.includes(m[1])) {
      result.images.push(m[1]);
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
