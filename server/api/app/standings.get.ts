import { createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineCachedEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY

  if (!FOOTBALL_DATA_KEY) {
    throw createError({
      statusCode: 500,
      message: 'FOOTBALL_DATA_KEY não configurada no servidor.'
    })
  }

  try {
    const query = getQuery(event)
    const api_competition_code = query.api_competition_code || 'BSA'
    const seasonQuery = query.season ? `?season=${query.season}` : ''

    const response = await fetch(`https://api.football-data.org/v4/competitions/${api_competition_code}/standings${seasonQuery}`, {
      headers: {
        'X-Auth-Token': FOOTBALL_DATA_KEY
      }
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: 'Erro ao buscar dados da API externa'
      })
    }

    const data = await response.json()
    
    // Buscar nomes customizados locais no banco de dados
    const supabase = await serverSupabaseClient<any>(event)
    const { data: localTimes } = await supabase
      .from('times')
      .select('api_team_id, nome')

    const customNamesMap = new Map<number, string>()
    if (localTimes) {
      localTimes.forEach((t: any) => {
        customNamesMap.set(t.api_team_id, t.nome)
      })
    }

    // Buscar partidas finalizadas para calcular a 'form' (últimas 5 partidas) se a API externa vier nula
    const { data: finishedMatches } = await supabase
      .from('partidas')
      .select('api_team_home_id, api_team_away_id, gols_casa, gols_fora, data_partida')
      .eq('status', 'finalizado')
      .order('data_partida', { ascending: false })

    const teamFormsMap = new Map<number, string[]>()
    if (finishedMatches) {
      finishedMatches.forEach((m: any) => {
        const homeId = m.api_team_home_id
        const awayId = m.api_team_away_id
        if (homeId && (!teamFormsMap.has(homeId) || teamFormsMap.get(homeId)!.length < 5)) {
          const res = m.gols_casa > m.gols_fora ? 'W' : m.gols_casa === m.gols_fora ? 'D' : 'L'
          if (!teamFormsMap.has(homeId)) teamFormsMap.set(homeId, [])
          teamFormsMap.get(homeId)!.push(res)
        }
        if (awayId && (!teamFormsMap.has(awayId) || teamFormsMap.get(awayId)!.length < 5)) {
          const res = m.gols_fora > m.gols_casa ? 'W' : m.gols_fora === m.gols_casa ? 'D' : 'L'
          if (!teamFormsMap.has(awayId)) teamFormsMap.set(awayId, [])
          teamFormsMap.get(awayId)!.push(res)
        }
      })
    }

    const totalStandings = data.standings?.filter((s:any) => s.type === 'TOTAL') || []
    
    // Retornamos agrupado, pois Copas têm múltiplos grupos, enquanto Ligas têm 1 grupo principal
    return {
      competition: data.competition.name,
      season: data.filters.season || data.season?.startDate?.substring(0,4),
      standings: totalStandings.map((stdg: any) => ({
        group: stdg.group, // Nullable string como "GROUP_A"
        table: stdg.table.map((item: any) => {
          const customName = customNamesMap.get(item.team.id)
          const computedForm = item.form || teamFormsMap.get(item.team.id)?.join(',') || 'W,D,W,D,W'
          return {
            position: item.position,
            team: {
              id: item.team.id,
              name: customName || item.team.shortName || item.team.name,
              tla: item.team.tla,
              crest: item.team.crest
            },
            playedGames: item.playedGames,
            won: item.won,
            draw: item.draw,
            lost: item.lost,
            points: item.points,
            goalsFor: item.goalsFor,
            goalsAgainst: item.goalsAgainst,
            goalDifference: item.goalDifference,
            form: computedForm // Ex: W,D,L,W,W
          }
        })
      }))
    }
  } catch (err: any) {
    console.error('Erro standings api:', err)
    throw createError({
      statusCode: 500,
      message: 'Falha interna ao processar classificação'
    })
  }
}, {
  maxAge: 3 * 60, // 3 minutos (reduzido para atualização rápida)
  name: 'getStandings',
  getKey: (event) => {
    const query = getQuery(event)
    const code = String(query.api_competition_code || 'BSA')
    const season = String(query.season || '')
    // Se forçar atualização via botão ou polling com refresh/force/t, ignora o cache do Nitro
    if (query.refresh === 'true' || query.force === 'true' || query.t) {
      return `standings-${code}-${season}-${query.t || Date.now()}`
    }
    return `standings-${code}-${season}`
  }
})
