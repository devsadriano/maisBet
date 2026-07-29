import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const supabase = await serverSupabaseServiceRole<any>(event)
  const body = await readBody(event)
  const matchday = parseInt(body.matchday)
  const campeonato_id = body.campeonato_id

  if (!matchday || isNaN(matchday)) {
    throw createError({ statusCode: 400, message: 'O número da rodada (matchday) é obrigatório e deve ser numérico.' })
  }

  if (!campeonato_id) {
    throw createError({ statusCode: 400, message: 'O campeonato_id é obrigatório.' })
  }

  const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY
  if (!FOOTBALL_DATA_KEY) {
    throw createError({ statusCode: 500, message: 'A chave FOOTBALL_DATA_KEY não está configurada no servidor.' })
  }

  try {
    // Buscar campeonato pelo ID (não mais por código, para suportar duplicatas)
    const { data: campeonatoData } = await supabase
      .from('campeonatos')
      .select('id, api_competition_code, season, max_rodadas, formato')
      .eq('id', campeonato_id)
      .single()

    if (!campeonatoData) {
      throw createError({ statusCode: 404, message: 'Campeonato não encontrado.' })
    }

    const api_competition_code = campeonatoData.api_competition_code
    const max_rodadas = campeonatoData.max_rodadas || 38

    // 1. Buscar partidas na API
    const seasonParam = campeonatoData.season ? `&season=${campeonatoData.season}` : ''
    const res = await fetch(`https://api.football-data.org/v4/competitions/${api_competition_code}/matches?matchday=${matchday}${seasonParam}`, {
      headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY }
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw createError({ statusCode: res.status, message: `Erro na Football-Data API: ${errorText}` })
    }

    const data = await res.json()
    const matches = data.matches || []

    if (matches.length === 0) {
      return { success: true, message: `Nenhuma partida encontrada para a rodada ${matchday}.`, updated: 0 }
    }

    // 2. Buscar participantes DESTE campeonato específico via campeonato_acessos
    const { data: acessosData, count: totalParticipants } = await supabase
      .from('campeonato_acessos')
      .select('time_id, times(api_team_id)', { count: 'exact' })
      .eq('campeonato_id', campeonato_id)
      .not('time_id', 'is', null)

    const userTeamIds = new Set(
      acessosData?.map((a: any) => Array.isArray(a.times) ? a.times[0]?.api_team_id : a.times?.api_team_id).filter(Boolean) || []
    )

    let mandatoryMatchesCount = 0
    const matchesProcessed = matches.map((m: any) => {
      let is_mandatory = false
      if (matchday === max_rodadas) {
        is_mandatory = true // Última Rodada: Tudo é obrigatório
      } else if (userTeamIds.has(m.homeTeam.id) || userTeamIds.has(m.awayTeam.id)) {
        is_mandatory = true // Time de algum participante
      }
      
      if (is_mandatory) mandatoryMatchesCount++
      
      return { ...m, is_mandatory }
    })

    // Regra: "dois jogos extras" + 1 por confronto direto entre times dos participantes
    let confrontations = 0
    matchesProcessed.forEach((m: any) => {
      if (userTeamIds.has(m.homeTeam.id) && userTeamIds.has(m.awayTeam.id)) {
        confrontations++
      }
    })
    const requiredExtras = matchday === max_rodadas 
      ? 0 
      : 1 + confrontations

    // 3. Calcular os Deadlines com base no primeiro jogo (excluindo adiados)
    const nonPostponedMatches = matchesProcessed.filter((m: any) => !['POSTPONED', 'CANCELLED', 'SUSPENDED'].includes(m.status))
    const validMatchesForDeadline = nonPostponedMatches.length > 0 ? nonPostponedMatches : matchesProcessed
    const sortedMatches = [...validMatchesForDeadline].sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    const firstMatchDate = new Date(sortedMatches[0].utcDate)

    const isMataMata = campeonatoData?.formato === 'copa' && matchday > 3
    const deadlineHours = isMataMata ? 2 : 1

    const bettingDeadline = new Date(firstMatchDate.getTime() - deadlineHours * 60 * 60 * 1000).toISOString()
    const organizerDeadline = new Date(firstMatchDate.getTime() - deadlineHours * 60 * 60 * 1000).toISOString() // Prazo organizador: se não escolher, sistema auto-seleciona

    // 4. Buscar ou criar a Rodada — FILTRAR POR CAMPEONATO
    let rodadaId = null
    const { data: existingRodada } = await supabase
      .from('rodadas')
      .select('id')
      .eq('numero_rodada', matchday)
      .eq('campeonato_id', campeonato_id)
      .single()

    if (existingRodada) {
      rodadaId = existingRodada.id
      // Atualiza prazos e required_extras
      await supabase.from('rodadas').update({
        organizer_deadline: organizerDeadline,
        betting_deadline: bettingDeadline,
        required_extra_games: requiredExtras
      }).eq('id', rodadaId)
    } else {
      // Cria a nova rodada escolhendo o organizador entre participantes do campeonato
      const { data: organizerId, error: rpcError } = await supabase.rpc('get_organizer_for_round', {
        p_numero_rodada: matchday,
        p_campeonato_id: campeonato_id
      })

      if (rpcError) {
        console.warn(`[sync/matches] Erro no RPC get_organizer_for_round: ${rpcError.message}`)
      }

      const { data: newRodada, error: rodadaError } = await supabase
        .from('rodadas')
        .insert({
          numero_rodada: matchday,
          campeonato_id: campeonato_id,
          status: matchday === max_rodadas ? 'aberta' : 'aguardando_escolha',
          organizer_id: organizerId || null,
          organizer_deadline: organizerDeadline,
          betting_deadline: bettingDeadline,
          required_extra_games: requiredExtras
        })
        .select('id')
        .single()

      if (rodadaError) throw createError({ statusCode: 500, message: rodadaError.message })
      rodadaId = newRodada.id
    }

    // 5. Inserir partidas — insert direto (não mais upsert por api_match_id global)
    // Primeiro verificar se já existem partidas nesta rodada para este match
    let updatedCount = 0
    for (const m of matchesProcessed) {
      let localStatus = 'agendado'
      if (m.status === 'FINISHED' || m.status === 'AWARDED') localStatus = 'finalizado'
      if (m.status === 'POSTPONED' || m.status === 'CANCELLED') localStatus = 'adiado'
      if (m.status === 'IN_PLAY' || m.status === 'PAUSED') localStatus = 'agendado' 

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
        grupo: m.group || null,
        is_mandatory: m.is_mandatory
      }

      // Upsert com constraint composta (api_match_id + rodada_id)
      const { error: matchError } = await supabase
        .from('partidas')
        .upsert(matchData, { onConflict: 'api_match_id,rodada_id' })

      if (!matchError) {
        updatedCount++
      } else {
        console.error(`Error upserting match ${m.id}:`, matchError)
      }
    }

    return { 
      success: true, 
      message: `Rodada criada! ${updatedCount} partidas importadas/atualizadas na Rodada ${matchday}.`,
      updated: updatedCount 
    }

  } catch (err: any) {
    console.error('Error in /api/sync/matches:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Internal Server Error'
    })
  }
})
