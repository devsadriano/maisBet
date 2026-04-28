import { requireAdmin } from '../../../utils/requireAdmin'

// Criamos um cache nativo em memória rápido para não esgotar as requisições API
// já que a lista de ligas globais quase nunca muda.
let _cachedLeagues: any[] | null = null
let _cacheTime = 0
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 horas

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  if (_cachedLeagues && Date.now() - _cacheTime < CACHE_TTL) {
    return { success: true, fromCache: true, leagues: _cachedLeagues }
  }

  const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY
  if (!FOOTBALL_DATA_KEY) {
    throw createError({ statusCode: 500, message: 'A chave FOOTBALL_DATA_KEY não está configurada.' })
  }

  try {
    const response = await fetch('https://api.football-data.org/v4/competitions', {
      headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY }
    })

    if (!response.ok) {
        throw createError({ statusCode: response.status, message: 'Erro na API Externa' })
    }

    const data = await response.json()
    const validCompetitions = data.competitions || []

    // Mapeamento extraindo o que interessa para UI com nomes claros
    const mappedLeagues = validCompetitions.map((comp: any) => ({
      id: comp.id,
      code: comp.code,
      name: comp.name,
      type: comp.type, // LEAGUE, CUP
      emblem: comp.emblem,
      area: {
        name: comp.area?.name,
        flag: comp.area?.flag,
      },
      currentSeason: comp.currentSeason ? {
        startDate: comp.currentSeason.startDate,
        endDate: comp.currentSeason.endDate,
        currentMatchday: comp.currentSeason.currentMatchday
      } : null,
      numberOfAvailableSeasons: comp.numberOfAvailableSeasons
    }))

    _cachedLeagues = mappedLeagues
    _cacheTime = Date.now()

    return {
      success: true,
      fromCache: false,
      leagues: mappedLeagues
    }
  } catch (err: any) {
    console.error('Error fetching leagues:', err)
    throw createError({
        statusCode: err.statusCode || 500,
        message: err.message || 'Erro ao buscar ligas.'
    })
  }
})
