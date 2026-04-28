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

    // 1. Achar a última rodada no banco
    const { data: lastRounds, error: roundsErr } = await supabase
        .from('rodadas')
        .select('numero_rodada')
        .order('numero_rodada', { ascending: false })
        .limit(1)

    if (roundsErr) throw roundsErr

    const currentMatchday = lastRounds && lastRounds.length > 0 ? lastRounds[0].numero_rodada : 0
    const nextMatchday = currentMatchday + 1

    if (nextMatchday > 38) {
        return new Response(JSON.stringify({ skipped: true, message: 'Campeonato finalizado.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    console.log(`Tentando importar rodada ${nextMatchday}...`)

    // 2. Chama a API para ver se a rodada existe/já tem datas
    const res = await fetch(`https://api.football-data.org/v4/competitions/BSA/matches?matchday=${nextMatchday}`, {
      headers: { 'X-Auth-Token': footballdataKey }
    })

    if (!res.ok) {
      throw new Error(`Erro na API Football-Data: ${await res.text()}`)
    }

    const data = await res.json()
    const matches = data.matches || []

    if (matches.length === 0) {
      return new Response(JSON.stringify({ skipped: true, message: `Nenhuma partida da rodada ${nextMatchday} encontrada ainda.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Verifica se a rodada está muito longe (vamos importar apenas se for a proxima rodada efetivamente ou se já tiver datas definidas na semana atual)
    // Para simplificar, como o script roda 1x por semana, se já tem as partidas publicadas na API, nós travamos / inserimos.

    console.log('Partidas encontradas, construindo a rodada.')

    // Lógica compartilhada do `sync/matches.post.ts`
    const { count: totalParticipants } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false)

    const { data: usersWithTeams } = await supabase
      .from('usuarios')
      .select('times(api_team_id)')
      .eq('is_admin', false)
      .not('time_id', 'is', null)

    const userTeamIds = new Set(usersWithTeams?.map((u: any) => u.times?.api_team_id).filter(Boolean) || [])

    let mandatoryMatchesCount = 0
    const matchesProcessed = matches.map((m: any) => {
      let is_mandatory = false
      if (nextMatchday === 38) {
        is_mandatory = true
      } else if (userTeamIds.has(m.homeTeam.id) || userTeamIds.has(m.awayTeam.id)) {
        is_mandatory = true
      }
      if (is_mandatory) mandatoryMatchesCount++
      return { ...m, is_mandatory }
    })

    const requiredExtras = nextMatchday === 38 
      ? 0 
      : Math.max(0, (totalParticipants || 0) + 2 - mandatoryMatchesCount)

    const sortedMatches = [...matchesProcessed].sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    const firstMatchDate = new Date(sortedMatches[0].utcDate)

    const bettingDeadline = new Date(firstMatchDate.getTime() - 60 * 60 * 1000).toISOString()
    const organizerDeadline = new Date(firstMatchDate.getTime() - 12 * 60 * 60 * 1000).toISOString()

    const { data: organizerId, error: rpcError } = await supabase.rpc('get_organizer_for_round', {
      p_numero_rodada: nextMatchday
    })

    if (rpcError || !organizerId) {
       console.error("Erro RPC organizer", rpcError)
    }

    const { data: newRodada, error: rodadaError } = await supabase
      .from('rodadas')
      .insert({
        numero_rodada: nextMatchday,
        status: nextMatchday === 38 ? 'aberta' : 'aguardando_escolha',
        organizer_id: organizerId,
        organizer_deadline: organizerDeadline,
        betting_deadline: bettingDeadline,
        required_extra_games: requiredExtras
      })
      .select('id')
      .single()

    if (rodadaError) throw rodadaError

    const rodadaId = newRodada.id
    let updatedCount = 0

    for (const m of matchesProcessed) {
      let localStatus = 'agendado'
      if (m.status === 'FINISHED' || m.status === 'AWARDED') localStatus = 'finalizado'
      if (m.status === 'POSTPONED' || m.status === 'CANCELLED') localStatus = 'adiado'

      const matchData = {
        api_match_id: m.id,
        rodada_id: rodadaId,
        time_casa: m.homeTeam.shortName || m.homeTeam.name,
        time_fora: m.awayTeam.shortName || m.awayTeam.name,
        api_team_home_id: m.homeTeam.id,
        api_team_away_id: m.awayTeam.id,
        gols_casa: m.score?.fullTime?.home ?? null,
        gols_fora: m.score?.fullTime?.away ?? null,
        status: localStatus,
        data_partida: m.utcDate,
        is_mandatory: m.is_mandatory
      }

      const { error: matchError } = await supabase
        .from('partidas')
        .upsert(matchData, { onConflict: 'api_match_id' })

      if (!matchError) updatedCount++
    }

    return new Response(JSON.stringify({
      success: true,
      rodada_id: rodadaId,
      numero_rodada: nextMatchday,
      matches_inserted: updatedCount
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
