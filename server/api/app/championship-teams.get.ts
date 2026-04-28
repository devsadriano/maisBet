import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseServiceRole<any>(event)
  const campeonato_id = getQuery(event).campeonato_id as string

  if (!campeonato_id) {
    throw createError({ statusCode: 400, statusMessage: 'campeonato_id é obrigatório.' })
  }

  const { data: rodadas, error: rodadasErr } = await supabase
    .from('rodadas')
    .select('id')
    .eq('campeonato_id', campeonato_id)

  if (rodadasErr || !rodadas || rodadas.length === 0) {
    return []
  }

  const rodadaIds = rodadas.map((r: any) => r.id)

  const { data: partidas, error } = await supabase
    .from('partidas')
    .select('api_team_home_id, api_team_away_id')
    .in('rodada_id', rodadaIds)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const teamIds = new Set<number>()
  partidas?.forEach((p: any) => {
    if (p.api_team_home_id) teamIds.add(p.api_team_home_id)
    if (p.api_team_away_id) teamIds.add(p.api_team_away_id)
  })

  if (teamIds.size === 0) return []

  const { data: times, error: timesErr } = await supabase
    .from('times')
    .select('*')
    .in('api_team_id', Array.from(teamIds))
    .order('nome', { ascending: true })

  if (timesErr) {
    throw createError({ statusCode: 500, statusMessage: timesErr.message })
  }

  return times || []
})
