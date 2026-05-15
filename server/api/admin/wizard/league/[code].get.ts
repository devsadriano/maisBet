import { requireAdmin } from '../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const code = getRouterParam(event, 'code')
  
  const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY
  if (!FOOTBALL_DATA_KEY) {
    throw createError({ statusCode: 500, message: 'A chave FOOTBALL_DATA_KEY não está configurada.' })
  }

  try {
    const response = await fetch(`https://api.football-data.org/v4/competitions/${code}`, {
      headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY }
    })

    if (!response.ok) {
        throw createError({ statusCode: response.status, message: `Erro na API Externa buscando liga ${code}` })
    }

    const data = await response.json()

    let suggestedMax = 38
    if (data.seasons && data.seasons.length > 0) {
      const pastSeason = data.seasons.find((s: any) => s.winner !== null || new Date(s.endDate) < new Date())
      if (pastSeason && pastSeason.currentMatchday) {
        suggestedMax = pastSeason.currentMatchday
      } else if (data.currentSeason?.currentMatchday) {
        suggestedMax = data.currentSeason.currentMatchday
      }
    }

    return {
      success: true,
      league: {
        id: data.id,
        code: data.code,
        name: data.name,
        emblem: data.emblem,
        type: data.type,
        startDate: data.currentSeason?.startDate,
        endDate: data.currentSeason?.endDate,
        currentMatchday: data.currentSeason?.currentMatchday,
        suggestedMax: suggestedMax,
        area: {
            name: data.area?.name,
            flag: data.area?.flag
        }
      }
    }
  } catch (err: any) {
    console.error('Error fetching league detail:', err)
    throw createError({ statusCode: err.statusCode || 500, message: err.message })
  }
})
