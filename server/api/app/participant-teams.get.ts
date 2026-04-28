import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * GET /api/app/participant-teams?campeonato_id=xxx
 * 
 * Retorna os api_team_id de todos os participantes que já escolheram
 * time neste campeonato. Usa service role para bypassar RLS.
 */
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseServiceRole<any>(event)
  const campeonato_id = getQuery(event).campeonato_id as string

  if (!campeonato_id) {
    throw createError({ statusCode: 400, statusMessage: 'campeonato_id é obrigatório.' })
  }

  const { data: acessos, error } = await supabase
    .from('campeonato_acessos')
    .select('times(api_team_id)')
    .eq('campeonato_id', campeonato_id)
    .not('time_id', 'is', null)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const teamApiIds = acessos
    ?.map((a: any) => a.times?.api_team_id)
    .filter(Boolean) || []

  return { teamApiIds }
})
