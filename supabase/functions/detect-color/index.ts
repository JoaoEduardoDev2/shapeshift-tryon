import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_url } = await req.json();
    if (!image_url) {
      return new Response(JSON.stringify({ error: "image_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a color analysis expert for cosmetics and makeup products. Analyze product images and extract color information. Always respond with valid JSON only, no markdown.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this makeup/cosmetic product image and extract:
1. color_hex: the dominant color as hex (e.g. #D94A64)
2. color_rgb: the RGB values as string (e.g. "217, 74, 100")
3. color_tone: descriptive name in Portuguese (e.g. "vermelho rosado", "nude bege", "marrom chocolate")
4. skin_tone: if it's a foundation/concealer, classify as "claro", "medio", "bronze", or "escuro". Otherwise null.
5. undertone: if it's a foundation/concealer, classify as "quente", "frio", or "neutro". Otherwise null.
6. finish: classify as "matte", "brilho", "acetinado", "metalico", or "cremoso"

Respond ONLY with a JSON object with these exact keys.`
              },
              {
                type: "image_url",
                image_url: { url: image_url }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_color_info",
              description: "Extract color information from a cosmetic product image",
              parameters: {
                type: "object",
                properties: {
                  color_hex: { type: "string", description: "Hex color code" },
                  color_rgb: { type: "string", description: "RGB values as string" },
                  color_tone: { type: "string", description: "Descriptive color name in Portuguese" },
                  skin_tone: { type: ["string", "null"], description: "Skin tone classification or null" },
                  undertone: { type: ["string", "null"], description: "Undertone classification or null" },
                  finish: { type: "string", description: "Finish type" }
                },
                required: ["color_hex", "color_rgb", "color_tone", "finish"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_color_info" } }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    let colorData;
    if (toolCall?.function?.arguments) {
      colorData = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content directly
      const content = aiResult.choices?.[0]?.message?.content || "";
      try {
        colorData = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      } catch {
        colorData = {
          color_hex: "#C0C0C0",
          color_rgb: "192, 192, 192",
          color_tone: "não identificado",
          skin_tone: null,
          undertone: null,
          finish: "matte"
        };
      }
    }

    return new Response(JSON.stringify(colorData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("detect-color error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
