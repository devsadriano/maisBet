// Atualizado
// @ts-ignore
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// @ts-ignore
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    // @ts-ignore
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables.')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Achar rodadas potencialmente ativas
    const { data: rodadas, error: rodadasErr } = await supabase
      .from('rodadas')
      .select('id, numero_rodada, status')
      .in('status', ['aberta', 'fechada']) // 'fechada' significa palpites fechados, mas faltam jogos

    if (rodadasErr) throw rodadasErr

    if (!rodadas || rodadas.length === 0) {
      return new Response(JSON.stringify({ skipped: true, message: 'Nenhuma rodada aguardando encerramento.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let encerradas = 0
    let pendentes_info = []

    for (const rodada of rodadas) {
        // Verifica todos os jogos da rodada
        const { data: partidas, error: partidasErr } = await supabase
            .from('partidas')
            .select('status, is_mandatory, is_extra')
            .eq('rodada_id', rodada.id)
            .or('is_mandatory.eq.true,is_extra.eq.true')

        if (partidasErr) throw partidasErr

        if (!partidas || partidas.length === 0) {
            continue
        }

        // Se 100% dos jogos obrigatórios ou extras estiverem 'finalizados' ou 'adiados'
        const todasEncerradas = partidas.every((p: any) => p.status === 'finalizado' || p.status === 'adiado')

        if (todasEncerradas) {
            const { error: fechaErr } = await supabase
                .from('rodadas')
                .update({ status: 'finalizada' })
                .eq('id', rodada.id)
            
            if (fechaErr) {
                console.error(`Erro ao finalizar rodada ${rodada.numero_rodada}:`, fechaErr)
            } else {
                encerradas++
            }
        } else {
            pendentes_info.push(`Rodada ${rodada.numero_rodada} ainda tem jogos em aberto.`)
        }
    }

    return new Response(JSON.stringify({
      success: true,
      rodadas_encerradas: encerradas,
      pendencias: pendentes_info.length > 0 ? pendentes_info : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
