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

    const response = await fetch(`https://api.football-data.org/v4/competitions/${api_competition_code}/standings`, {
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

    const totalStandings = data.standings?.filter((s:any) => s.type === 'TOTAL') || []
    
    // Retornamos agrupado, pois Copas têm múltiplos grupos, enquanto Ligas têm 1 grupo principal
    return {
      competition: data.competition.name,
      season: data.filters.season || data.season?.startDate?.substring(0,4),
      standings: totalStandings.map((stdg: any) => ({
        group: stdg.group, // Nullable string como "GROUP_A"
        table: stdg.table.map((item: any) => {
          const customName = customNamesMap.get(item.team.id)
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
            form: item.form // Ex: W,D,L,W,W
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
  maxAge: 10 * 60, // 10 minutos
  name: 'getStandings',
  getKey: (event) => {
    const query = getQuery(event)
    return query.api_competition_code || 'BSA'
  }
})
