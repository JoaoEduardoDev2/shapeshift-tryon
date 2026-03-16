import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { session_id, user_image_base64, product_id } = await req.json();

    if (!session_id || !user_image_base64 || !product_id) {
      return new Response(
        JSON.stringify({ error: "session_id, user_image_base64 and product_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("name, description, image_url")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call the virtual-tryon AI function
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `You are a virtual try-on AI system for fashion e-commerce. 

The user has uploaded their photo. Your task is to generate a new version of this EXACT same photo where the person is wearing the following garment:

GARMENT: ${product.name}
DESCRIPTION: ${product.description || "Fashion garment"}

CRITICAL INSTRUCTIONS:
- Keep the EXACT same person, face, pose, background, and lighting
- The garment must look REALISTIC on the person's body
- Respect the person's body proportions, pose, and perspective
- Add proper shadows, folds, and fabric physics
- The garment must look like it naturally fits the person
- Do NOT change anything about the person except adding the garment
- The result should look like a real photograph, not a digital overlay
- Maintain the original photo quality and lighting conditions`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: user_image_base64 } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI processing failed [${aiResponse.status}]` }),
        { status: aiResponse.status === 429 ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const resultImage = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!resultImage) {
      return new Response(
        JSON.stringify({ error: "AI did not generate an image. Try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save the result as a look
    const { data: savedLook, error: saveError } = await supabase
      .from("saved_looks")
      .insert({
        user_id: userId,
        garment_name: product.name,
        garment_description: product.description,
        image_base64: resultImage,
        mode: "api",
      })
      .select("id")
      .single();

    // Log warp event
    await supabase.from("analytics_events").insert({
      user_id: userId,
      event_type: "tryon_warp",
      product_id,
      metadata: { session_id, result_id: savedLook?.id },
    });

    return new Response(
      JSON.stringify({
        session_id,
        result_id: savedLook?.id || null,
        image: resultImage,
        status: "completed",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Warp error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
