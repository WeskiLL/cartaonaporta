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
    const url = new URL(req.url);
    const orderNumber = url.searchParams.get("orderNumber");

    if (!orderNumber) {
      return new Response(JSON.stringify({ error: "Número do pedido não informado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order (only safe fields)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, number, status, created_at, client_name")
      .eq("number", orderNumber)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch tracking info if order is in shipping or delivered
    let tracking = null;
    if (order.status === "shipping" || order.status === "delivered") {
      const { data: trackingData } = await supabase
        .from("order_trackings")
        .select("tracking_code, status, estimated_delivery, events")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (trackingData) {
        tracking = {
          tracking_code: trackingData.tracking_code,
          status: trackingData.status,
          estimated_delivery: trackingData.estimated_delivery,
          tracking_url: `https://rastreamento.correios.com.br/app/index.php?objetos=${trackingData.tracking_code}`,
        };
      }
    }

    // Fetch company info (logos)
    const { data: company } = await supabase
      .from("company")
      .select("name, logo_url")
      .limit(1)
      .single();

    return new Response(
      JSON.stringify({
        order: {
          number: order.number,
          status: order.status,
          created_at: order.created_at,
          client_name: order.client_name,
        },
        tracking,
        company,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
