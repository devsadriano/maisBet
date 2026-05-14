import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'

/**
 * POST /api/admin/start-championship
 * 
 * Inicia o bolão automaticamente:
 * 1. Consulta a API Football-Data para descobrir a rodada atual
 * 2. Importa rodadas passadas como 'finalizada' (com placares)
 * 3. Importa a rodada atual como 'aguardando_escolha'
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const supabase = await serverSupabaseServiceRole<any>(event)

  const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY
  if (!FOOTBALL_DATA_KEY) {
    throw createError({ statusCode: 500, message: 'A chave FOOTBALL_DATA_KEY não está configurada no servidor.' })
  }

  const body = await readBody(event)
  const campeonato_id = body?.campeonato_id

  if (!campeonato_id) {
    throw createError({ statusCode: 400, message: 'O ID do campeonato é obrigatório (campeonato_id).' })
  }

  // Obter detalhes do campeonato para construir a request
  const { data: campeonato } = await supabase
    .from('campeonatos')
    .select('api_competition_code, season, max_rodadas')
    .eq('id', campeonato_id)
    .single()

  if (!campeonato) {
    throw createError({ statusCode: 404, message: 'Campeonato não encontrado.' })
  }

  const { api_competition_code, season, max_rodadas } = campeonato

  // Verificar idempotência baseada NESTE campeonato
  const { count: existingRounds } = await supabase
    .from('rodadas')
    .select('*', { count: 'exact', head: true })
    .eq('campeonato_id', campeonato_id)

  if ((existingRounds ?? 0) > 0) {
    throw createError({ statusCode: 409, message: 'Este campeonato já foi iniciado! Já existem rodadas nele.' })
  }

  try {
    // 1. Descobrir a rodada atual do Campeonato
    const competitionRes = await fetch(`https://api.football-data.org/v4/competitions/${api_competition_code}`, {
      headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY }
    })

    if (!competitionRes.ok) {
      const errorText = await competitionRes.text()
      throw createError({ statusCode: competitionRes.status, message: `Erro ao consultar competição: ${errorText}` })
    }

    const competitionData = await competitionRes.json()
    const currentMatchday: number = competitionData.currentSeason?.currentMatchday || 1

    // Buscar participantes DESTE campeonato específico via campeonato_acessos
    const { data: acessosData, count: totalParticipants } = await supabase
      .from('campeonato_acessos')
      .select('time_id, times(api_team_id)', { count: 'exact' })
      .eq('campeonato_id', campeonato_id)
      .not('time_id', 'is', null)

    const userTeamIds = new Set(
      acessosData?.map((a: any) => a.times?.api_team_id).filter(Boolean) || []
    )

    const results: Array<{ round: number; status: string; matches: number }> = []

    // 3. Loop: importar rodadas de 1 até currentMatchday
    for (let matchday = 1; matchday <= currentMatchday; matchday++) {
      const isCurrentRound = matchday === currentMatchday
      const isPastRound = !isCurrentRound

      // Rate limit: delay de 6.5s entre chamadas (exceto a primeira)
      if (matchday > 1) {
        await new Promise(resolve => setTimeout(resolve, 6500))
      }

      // Buscar partidas da API com a season específica
      const res = await fetch(
        `https://api.football-data.org/v4/competitions/${api_competition_code}/matches?matchday=${matchday}&season=${season}`,
        { headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY } }
      )

      if (!res.ok) {
        console.error(`Erro ao buscar rodada ${matchday}: ${res.status}`)
        results.push({ round: matchday, status: 'erro', matches: 0 })
        continue
      }

      const data = await res.json()
      const matches = data.matches || []

      if (matches.length === 0) {
        results.push({ round: matchday, status: 'vazia', matches: 0 })
        continue
      }

      // Calcular jogos obrigatórios
      let mandatoryCount = 0
      const matchesProcessed = matches.map((m: any) => {
        let is_mandatory = false
        if (matchday === max_rodadas) {
          is_mandatory = true
        } else if (userTeamIds.has(m.homeTeam.id) || userTeamIds.has(m.awayTeam.id)) {
          is_mandatory = true
        }
        if (is_mandatory) mandatoryCount++
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
        : 2 + confrontations

      // Calcular deadlines
      const sortedMatches = [...matchesProcessed].sort(
        (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
      )
      const firstMatchDate = new Date(sortedMatches[0].utcDate)
      const bettingDeadline = new Date(firstMatchDate.getTime() - 60 * 60 * 1000).toISOString()
      const organizerDeadline = new Date(firstMatchDate.getTime() - 60 * 60 * 1000).toISOString() // Prazo organizador: se não escolher, sistema auto-seleciona

      // Calcular organizador
      const { data: organizerId } = await supabase.rpc('get_organizer_for_round', {
        p_numero_rodada: matchday,
        p_campeonato_id: campeonato_id
      })

      if (!organizerId) {
        console.error(`Sem organizador para rodada ${matchday}`)
        results.push({ round: matchday, status: 'erro_organizador', matches: 0 })
        continue
      }

      // Determinar status da rodada
      let roundStatus: string
      if (isPastRound) {
        roundStatus = 'finalizada'
      } else if (matchday === max_rodadas) {
        roundStatus = 'aberta'
      } else {
        roundStatus = 'aguardando_escolha'
      }

      // Inserir rodada
      const { data: newRodada, error: rodadaError } = await supabase
        .from('rodadas')
        .insert({
          numero_rodada: matchday,
          campeonato_id: campeonato_id,
          status: roundStatus,
          organizer_id: organizerId,
          organizer_deadline: organizerDeadline,
          betting_deadline: bettingDeadline,
          required_extra_games: requiredExtras
        })
        .select('id')
        .single()

      if (rodadaError) {
        console.error(`Erro ao criar rodada ${matchday}:`, rodadaError)
        results.push({ round: matchday, status: 'erro_db', matches: 0 })
        continue
      }

      // Inserir partidas
      let insertedCount = 0
      for (const m of matchesProcessed) {
        let localStatus: string = 'agendado'
        if (m.status === 'FINISHED' || m.status === 'AWARDED') localStatus = 'finalizado'
        if (m.status === 'POSTPONED' || m.status === 'CANCELLED') localStatus = 'adiado'

        // Para rodadas passadas, forçar finalizado se tiver placar
        if (isPastRound && m.score?.fullTime?.home !== null && m.score?.fullTime?.away !== null) {
          localStatus = 'finalizado'
        }

        const matchData = {
          api_match_id: m.id,
          rodada_id: newRodada.id,
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

        const { error } = await supabase
          .from('partidas')
          .upsert(matchData, { onConflict: 'api_match_id,rodada_id' })

        if (!error) insertedCount++
      }

      results.push({
        round: matchday,
        status: roundStatus,
        matches: insertedCount
      })
    }

    return {
      success: true,
      currentMatchday,
      totalRoundsImported: results.length,
      activeRound: currentMatchday,
      details: results,
      message: `Bolão iniciado! ${results.filter(r => r.status === 'finalizada').length} rodadas históricas + Rodada ${currentMatchday} ativa.`
    }

  } catch (err: any) {
    console.error('Error in /api/admin/start-championship:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Internal Server Error'
    })
  }
})
