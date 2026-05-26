import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * POST /api/app/fix-mandatory
 * 
 * Recalcula e persiste is_mandatory para todas as partidas de rodadas ativas
 * de um campeonato, com base nos times dos participantes atuais.
 */
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseServiceRole<any>(event)
  const body = await readBody(event)
  const campeonato_id = body?.campeonato_id
  const mark_all = body?.mark_all || false

  if (!campeonato_id) {
    throw createError({ statusCode: 400, statusMessage: 'campeonato_id é obrigatório.' })
  }

  // Buscar rodadas ativas (aberta ou aguardando_escolha)
  const { data: rodadas } = await supabase
    .from('rodadas')
    .select('id')
    .eq('campeonato_id', campeonato_id)
    .in('status', ['aberta', 'aguardando_escolha'])

  if (!rodadas || rodadas.length === 0) {
    return { success: true, message: 'Nenhuma rodada ativa.', updated: 0 }
  }

  let totalUpdated = 0

  if (mark_all) {
    // Para torneios como Copa do Mundo: marcar TODOS os jogos como obrigatórios
    for (const rodada of rodadas) {
      const { data: partidas } = await supabase
        .from('partidas')
        .select('id')
        .eq('rodada_id', rodada.id)

      if (partidas && partidas.length > 0) {
        const ids = partidas.map((p: any) => p.id)
        await supabase.from('partidas').update({ is_mandatory: true }).in('id', ids)
        totalUpdated += ids.length
      }
    }
    return { success: true, message: `${totalUpdated} partidas marcadas como obrigatórias (todas).`, updated: totalUpdated }
  }

  // Para Brasileirão: marcar apenas os jogos dos times dos participantes
  const { data: acessos } = await supabase
    .from('campeonato_acessos')
    .select('times(api_team_id)')
    .eq('campeonato_id', campeonato_id)
    .not('time_id', 'is', null)

  const userTeamIds = new Set(
    acessos?.map((a: any) => Array.isArray(a.times) ? a.times[0]?.api_team_id : a.times?.api_team_id).filter(Boolean) || []
  )

  if (userTeamIds.size === 0) {
    return { success: true, message: 'Nenhum participante com time selecionado.', updated: 0 }
  }

  for (const rodada of rodadas) {
    const { data: partidas } = await supabase
      .from('partidas')
      .select('id, api_team_home_id, api_team_away_id')
      .eq('rodada_id', rodada.id)

    if (!partidas) continue

    const mandatoryIds = partidas
      .filter((p: any) => userTeamIds.has(p.api_team_home_id) || userTeamIds.has(p.api_team_away_id))
      .map((p: any) => p.id)

    if (mandatoryIds.length > 0) {
      await supabase.from('partidas').update({ is_mandatory: true }).in('id', mandatoryIds)
      totalUpdated += mandatoryIds.length
    }
  }

  return { success: true, message: `${totalUpdated} partidas marcadas como obrigatórias.`, updated: totalUpdated }
})
