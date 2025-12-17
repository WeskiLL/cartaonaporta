import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const trackingCode = url.searchParams.get("code");

    if (!trackingCode) {
      return new Response(
        JSON.stringify({ error: "Tracking code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate tracking code format (basic validation)
    const sanitizedCode = trackingCode.toUpperCase().trim();
    if (sanitizedCode.length < 5 || sanitizedCode.length > 30) {
      return new Response(
        JSON.stringify({ error: "Invalid tracking code format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Looking up tracking code:", sanitizedCode);

    // Use limit(1) instead of maybeSingle() to handle potential duplicates gracefully
    const { data: results, error } = await supabase
      .from("order_trackings")
      .select("id, order_number, client_name, tracking_code, carrier, status, events, last_update")
      .eq("tracking_code", sanitizedCode)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to lookup tracking" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = results && results.length > 0 ? results[0] : null;

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Tracking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return only safe fields - NO phone number, NO order_id
    const safeData = {
      id: data.id,
      order_number: data.order_number,
      client_name: data.client_name,
      tracking_code: data.tracking_code,
      carrier: data.carrier,
      status: data.status,
      events: data.events || [],
      last_update: data.last_update,
    };

    return new Response(
      JSON.stringify(safeData),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
