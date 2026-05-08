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
    // @ts-ignore
    const footballdataKey = Deno.env.get('FOOTBALL_DATA_KEY')

    if (!supabaseUrl || !supabaseKey || !footballdataKey) {
      throw new Error('Missing environment variables.')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // LÓGICA CONSCIENTE: Verificar se há partidas que precisam de atualização ANTES de chamar a API
    // Partidas agendadas cuja data é nas últimas 4 horas (jogos que já começaram ou recém-terminaram)
    const threeHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    // Considera jogos até meia hora no futuro pra garantir
    const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { data: activeMatches, error: matchesErr } = await supabase
      .from('partidas')
      .select('rodada_id, data_partida, status')
      .eq('status', 'agendado')
      .gte('data_partida', threeHoursAgo)
      .lte('data_partida', thirtyMinutesFromNow)

    if (matchesErr) throw matchesErr

    if (!activeMatches || activeMatches.length === 0) {
      console.log('Nenhuma partida ativa nas ultimas horas. Ignorando chamada à API.')
      return new Response(JSON.stringify({ skipped: true, message: 'Nenhuma partida no período ativo. 0 tokens gastos.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Identificar de quais rodadas precisamos buscar dados (geralmente só 1)
    const rodadaIds = [...new Set(activeMatches.map((m: any) => m.rodada_id))]

    // Buscar rodadas COM informações do campeonato (para saber o código da competição)
    const { data: rodadas, error: rodadasErr } = await supabase
      .from('rodadas')
      .select('id, numero_rodada, campeonato_id, campeonatos(api_competition_code, season)')
      .in('id', rodadaIds)

    if (rodadasErr) throw rodadasErr

    let totalUpdated = 0
    let totalErros: string[] = []

    for (const rodada of rodadas) {
        const competitionCode = (rodada as any).campeonatos?.api_competition_code || 'BSA'
        const season = (rodada as any).campeonatos?.season
        const seasonParam = season ? `&season=${season}` : ''
        
        console.log(`Buscando dados da rodada ${rodada.numero_rodada} (${competitionCode})...`)
        
        const res = await fetch(`https://api.football-data.org/v4/competitions/${competitionCode}/matches?matchday=${rodada.numero_rodada}${seasonParam}`, {
            headers: { 'X-Auth-Token': footballdataKey }
        })

        if (!res.ok) {
            const errText = await res.text()
            totalErros.push(`Erro API rodada ${rodada.numero_rodada}: ${errText}`)
            continue
        }

        const data = await res.json()
        const matches = data.matches || []

        for (const m of matches) {
            let localStatus = 'agendado'
            if (m.status === 'FINISHED' || m.status === 'AWARDED') {
                localStatus = 'finalizado'
            } else if (m.status === 'POSTPONED' || m.status === 'CANCELLED' || m.status === 'SUSPENDED') {
                localStatus = 'adiado'
            }

            // Atualizar filtrando por api_match_id + rodada_id (campeonato-específico)
            const { error: matchError } = await supabase
                .from('partidas')
                .update({
                    gols_casa: m.score?.fullTime?.home ?? null,
                    gols_fora: m.score?.fullTime?.away ?? null,
                    status: localStatus,
                })
                .eq('api_match_id', m.id)
                .eq('rodada_id', rodada.id)
                // Atualiza só se estiver em status diferente de finalizado/adiado
                .eq('status', 'agendado') 

            if (matchError) {
                console.error(`Erro ao atualizar match ${m.id}`, matchError)
                totalErros.push(`match ${m.id}: ${matchError.message}`)
            } else {
                totalUpdated++
            }
        }
    }

    return new Response(JSON.stringify({
        success: true,
        updated: totalUpdated,
        rodadas_processadas: rodadas.map((r: any) => r.numero_rodada),
        erros: totalErros.length > 0 ? totalErros : undefined
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
