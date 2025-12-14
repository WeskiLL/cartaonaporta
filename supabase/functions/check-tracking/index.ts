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

interface CorreiosResponse {
  objetos?: Array<{
    codObjeto: string;
    eventos?: Array<{
      dtHrCriado: string;
      unidade?: {
        nome?: string;
        endereco?: {
          cidade?: string;
          uf?: string;
        };
      };
      descricao?: string;
      tipo?: string;
    }>;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tracking_code, tracking_id } = await req.json();

    if (!tracking_code) {
      return new Response(
        JSON.stringify({ error: 'Código de rastreio é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking tracking for code: ${tracking_code}`);

    // Try multiple APIs for Correios tracking
    let events: TrackingEvent[] = [];
    let trackingStatus = 'pending';

    // Try LinkCorreios API (free, no auth required)
    try {
      const response = await fetch(`https://api.linketrack.com/track/json?user=teste&token=1abcd00b2731640e886fb41a8a9671ad1434c599dbaa0a0de9a5aa619f29a83f&objeto=${tracking_code}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('LinkTrack API response:', JSON.stringify(data));

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

          // Determine status based on latest event
          if (events.length > 0) {
            const latestStatus = events[0].status.toLowerCase();
            if (latestStatus.includes('entregue') || latestStatus.includes('delivered')) {
              trackingStatus = 'delivered';
            } else if (latestStatus.includes('saiu para entrega') || latestStatus.includes('out for delivery')) {
              trackingStatus = 'out_for_delivery';
            } else if (latestStatus.includes('trânsito') || latestStatus.includes('transit')) {
              trackingStatus = 'in_transit';
            } else {
              trackingStatus = 'in_transit';
            }
          }
        }
      }
    } catch (apiError) {
      console.error('LinkTrack API error:', apiError);
    }

    // If no events found, try alternative API
    if (events.length === 0) {
      try {
        const altResponse = await fetch(`https://proxyapp.correios.com.br/v1/sro-rastro/${tracking_code}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (altResponse.ok) {
          const data: CorreiosResponse = await altResponse.json();
          console.log('Correios API response:', JSON.stringify(data));

          if (data.objetos?.[0]?.eventos) {
            events = data.objetos[0].eventos.map((evento: any) => {
              const dateObj = new Date(evento.dtHrCriado);
              return {
                date: dateObj.toLocaleDateString('pt-BR'),
                time: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                location: evento.unidade?.endereco?.cidade 
                  ? `${evento.unidade.endereco.cidade}/${evento.unidade.endereco.uf}`
                  : evento.unidade?.nome || 'Brasil',
                status: evento.descricao || 'Atualização',
                description: evento.descricao || 'Movimentação registrada',
              };
            });

            if (events.length > 0) {
              const latestStatus = events[0].status.toLowerCase();
              if (latestStatus.includes('entregue')) {
                trackingStatus = 'delivered';
              } else if (latestStatus.includes('saiu para entrega')) {
                trackingStatus = 'out_for_delivery';
              } else {
                trackingStatus = 'in_transit';
              }
            }
          }
        }
      } catch (altApiError) {
        console.error('Correios API error:', altApiError);
      }
    }

    // Update database if tracking_id provided
    if (tracking_id && events.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { error: updateError } = await supabase
        .from('order_trackings')
        .update({
          events: events,
          status: trackingStatus,
          last_update: new Date().toISOString(),
        })
        .eq('id', tracking_id);

      if (updateError) {
        console.error('Database update error:', updateError);
      } else {
        console.log(`Updated tracking ${tracking_id} with ${events.length} events`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tracking_code,
        status: trackingStatus,
        events,
        updated_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-tracking function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
