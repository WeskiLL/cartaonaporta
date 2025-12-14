import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  description: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting batch tracking check...');

    // Fetch all trackings that are not delivered
    const { data: trackings, error: fetchError } = await supabase
      .from('order_trackings')
      .select('*')
      .neq('status', 'delivered')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching trackings:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${trackings?.length || 0} trackings to check`);

    const results = {
      total: trackings?.length || 0,
      updated: 0,
      errors: 0,
      notifications: [] as string[],
    };

    for (const tracking of trackings || []) {
      try {
        // Query tracking API
        let events: TrackingEvent[] = [];
        let newStatus = tracking.status;

        try {
          const response = await fetch(
            `https://api.linketrack.com/track/json?user=teste&token=1abcd00b2731640e886fb41a8a9671ad1434c599dbaa0a0de9a5aa619f29a83f&objeto=${tracking.tracking_code}`,
            { method: 'GET', headers: { 'Accept': 'application/json' } }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.eventos && Array.isArray(data.eventos)) {
              events = data.eventos.map((evento: any) => {
                const dateTime = evento.data?.split(' ') || ['', ''];
                return {
                  date: dateTime[0] || new Date().toLocaleDateString('pt-BR'),
                  time: dateTime[1] || evento.hora || '',
                  location: evento.local || evento.cidade || 'Brasil',
                  status: evento.status || 'Atualização',
                  description: evento.subStatus?.[0] || evento.status || 'Movimentação registrada',
                };
              });

              if (events.length > 0) {
                const latestStatus = events[0].status.toLowerCase();
                if (latestStatus.includes('entregue') || latestStatus.includes('delivered')) {
                  newStatus = 'delivered';
                } else if (latestStatus.includes('saiu para entrega')) {
                  newStatus = 'out_for_delivery';
                } else if (latestStatus.includes('trânsito')) {
                  newStatus = 'in_transit';
                }
              }
            }
          }
        } catch (apiError) {
          console.error(`API error for ${tracking.tracking_code}:`, apiError);
        }

        // Check if there are updates
        const previousEventsCount = (tracking.events as any[])?.length || 0;
        const hasNewEvents = events.length > previousEventsCount;
        const statusChanged = tracking.status !== newStatus;

        if (hasNewEvents || statusChanged) {
          // Update database
          const { error: updateError } = await supabase
            .from('order_trackings')
            .update({
              events: events,
              status: newStatus,
              last_update: new Date().toISOString(),
            })
            .eq('id', tracking.id);

          if (updateError) {
            console.error(`Update error for ${tracking.id}:`, updateError);
            results.errors++;
          } else {
            results.updated++;
            console.log(`Updated tracking ${tracking.tracking_code} - Status: ${newStatus}`);

            // Track which clients should be notified
            if (tracking.client_phone) {
              results.notifications.push(
                `${tracking.client_name} (${tracking.tracking_code}): ${newStatus}`
              );
            }
          }
        }
      } catch (trackingError) {
        console.error(`Error processing tracking ${tracking.id}:`, trackingError);
        results.errors++;
      }
    }

    console.log('Batch check completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verificação de rastreios concluída',
        results,
        checked_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-all-trackings function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
