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
    const { tracking_code, tracking_id } = await req.json();

    if (!tracking_code) {
      return new Response(
        JSON.stringify({ error: 'Código de rastreio é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking tracking for code: ${tracking_code}`);

    let events: TrackingEvent[] = [];
    let trackingStatus = 'pending';
    let apiSuccess = false;
    let apiError = '';

    // API 1: Try Muambator API (usually more reliable)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`https://api.muambator.com.br/api/tracking/correios/${encodeURIComponent(tracking_code)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('Muambator API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        if (data.eventos && Array.isArray(data.eventos) && data.eventos.length > 0) {
          events = data.eventos.map((evento: any) => ({
            date: evento.data || new Date().toLocaleDateString('pt-BR'),
            time: evento.hora || '',
            location: evento.local || evento.cidade || 'Brasil',
            status: evento.status || 'Atualização',
            description: evento.descricao || evento.status || 'Movimentação registrada',
          }));
          apiSuccess = true;
        }
      }
    } catch (err) {
      console.log('Muambator API error:', err instanceof Error ? err.message : 'Unknown error');
    }

    // API 2: Try Rastro API
    if (!apiSuccess) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`https://api.rastrobot.com.br/v1/tracking/${encodeURIComponent(tracking_code)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('Rastrobot API response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          if (data.eventos && Array.isArray(data.eventos) && data.eventos.length > 0) {
            events = data.eventos.map((evento: any) => ({
              date: evento.data || new Date().toLocaleDateString('pt-BR'),
              time: evento.hora || '',
              location: evento.local || 'Brasil',
              status: evento.status || 'Atualização',
              description: evento.descricao || evento.status || 'Movimentação registrada',
            }));
            apiSuccess = true;
          }
        }
      } catch (err) {
        console.log('Rastrobot API error:', err instanceof Error ? err.message : 'Unknown error');
      }
    }

    // API 3: LinkTrack as last resort
    if (!apiSuccess) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`https://api.linketrack.com/track/json?user=teste&token=1abcd00b2731640e886fb41a8a9671ad1434c599dbaa0a0de9a5aa619f29a83f&objeto=${encodeURIComponent(tracking_code)}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('LinkTrack API response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          if (data.eventos && Array.isArray(data.eventos) && data.eventos.length > 0) {
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
            apiSuccess = true;
          }
        }
      } catch (err) {
        console.log('LinkTrack API error:', err instanceof Error ? err.message : 'Unknown error');
        apiError = 'Serviço de rastreamento temporariamente indisponível';
      }
    }

    // Determine status based on events
    if (events.length > 0) {
      const latestStatus = (events[0].status + ' ' + events[0].description).toLowerCase();
      if (latestStatus.includes('entregue') || latestStatus.includes('delivered')) {
        trackingStatus = 'delivered';
      } else if (latestStatus.includes('saiu para entrega') || latestStatus.includes('out for delivery')) {
        trackingStatus = 'out_for_delivery';
      } else if (latestStatus.includes('trânsito') || latestStatus.includes('transit') || latestStatus.includes('encaminhado')) {
        trackingStatus = 'in_transit';
      } else {
        trackingStatus = 'in_transit';
      }
    }

    // Update database if tracking_id provided and events found
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

    let message = '';
    if (apiSuccess && events.length > 0) {
      message = 'Rastreio consultado com sucesso';
    } else if (!apiSuccess && apiError) {
      message = apiError;
    } else {
      message = 'Objeto aguardando postagem ou código não encontrado nos Correios';
    }

    return new Response(
      JSON.stringify({
        success: apiSuccess,
        tracking_code,
        status: trackingStatus,
        events,
        updated_at: new Date().toISOString(),
        message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-tracking function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao consultar rastreio', 
        message: 'Tente novamente em alguns minutos' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
