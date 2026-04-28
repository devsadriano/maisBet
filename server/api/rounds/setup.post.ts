import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseServiceRole<any>(event)
  const body = await readBody(event)
  
  const { rodada_id, organizer_id, extra_match_ids } = body

  if (!rodada_id || !organizer_id || !Array.isArray(extra_match_ids)) {
    throw createError({ statusCode: 400, message: 'Faltam dados ou a lista de jogos extras é inválida.' })
  }

  // 1. Validar se a rodada existe e o usuário é mesmo o organizador
  const { data: rodada, error: fetchErr } = await supabase
    .from('rodadas')
    .select('status, organizer_id, campeonato_id, numero_rodada')
    .eq('id', rodada_id)
    .single()

  if (fetchErr || !rodada) {
    throw createError({ statusCode: 404, message: 'Rodada não encontrada.' })
  }

  if (rodada.organizer_id !== organizer_id) {
    throw createError({ statusCode: 403, message: 'Você não é o organizador desta rodada!' })
  }

  if (rodada.status !== 'aguardando_escolha') {
    throw createError({ statusCode: 400, message: 'Esta rodada já foi configurada e não está mais aguardando escolhas.' })
  }

  // Calcular dinamicamente os extras necessários: 2 + confrontos diretos
  const { data: campData } = await supabase
    .from('campeonatos')
    .select('max_rodadas')
    .eq('id', rodada.campeonato_id)
    .single()

  const max_rodadas = campData?.max_rodadas || 38

  // Buscar times dos participantes deste campeonato
  const { data: acessosData } = await supabase
    .from('campeonato_acessos')
    .select('times(api_team_id)')
    .eq('campeonato_id', rodada.campeonato_id)
    .not('time_id', 'is', null)

  const userTeamIds = new Set(
    acessosData?.map((a: any) => a.times?.api_team_id).filter(Boolean) || []
  )

  // Buscar partidas da rodada para contar confrontos
  const { data: partidasRodada } = await supabase
    .from('partidas')
    .select('api_team_home_id, api_team_away_id')
    .eq('rodada_id', rodada_id)

  let confrontations = 0
  partidasRodada?.forEach((p: any) => {
    if (userTeamIds.has(p.api_team_home_id) && userTeamIds.has(p.api_team_away_id)) {
      confrontations++
    }
  })

  const requiredExtras = rodada.numero_rodada === max_rodadas ? 0 : 2 + confrontations

  if (extra_match_ids.length !== requiredExtras) {
    throw createError({ statusCode: 400, message: `Obrigatório escolher exatos ${requiredExtras} jogos extras.` })
  }

  try {
    // 2. Zerar marcações antigas (para recalcular tudo limpo)
    await supabase.from('partidas').update({ is_extra: false, is_mandatory: false }).eq('rodada_id', rodada_id)

    // 3. Marcar jogos obrigatórios (times dos participantes)
    if (userTeamIds.size > 0 && partidasRodada) {
      const mandatoryIds = partidasRodada
        .filter((p: any) => userTeamIds.has(p.api_team_home_id) || userTeamIds.has(p.api_team_away_id))
        .map((p: any) => p.id)
        .filter(Boolean)

      if (mandatoryIds.length > 0) {
        // Need to get the actual IDs from partidas table
        const { data: partidasComId } = await supabase
          .from('partidas')
          .select('id, api_team_home_id, api_team_away_id')
          .eq('rodada_id', rodada_id)

        const mandatoryMatchIds = partidasComId
          ?.filter((p: any) => userTeamIds.has(p.api_team_home_id) || userTeamIds.has(p.api_team_away_id))
          .map((p: any) => p.id) || []

        if (mandatoryMatchIds.length > 0) {
          await supabase.from('partidas').update({ is_mandatory: true }).in('id', mandatoryMatchIds)
        }
      }
    }

    // 4. Marcar novos Extras
    if (extra_match_ids.length > 0) {
      await supabase.from('partidas').update({ is_extra: true }).in('id', extra_match_ids)
    }

    // 4. Atualizar status da rodada para "aberta" permitindo que palpites comecem!
    const { error: updErr } = await supabase.from('rodadas').update({ status: 'aberta' }).eq('id', rodada_id)

    if (updErr) throw new Error(updErr.message)

    return { success: true, message: 'Rodada configurada com sucesso! Palpites liberados.' }

  } catch (err: any) {
    console.error('Erro no setup da rodada:', err)
    throw createError({ statusCode: 500, message: err.message || 'Erro interno no servidor.' })
  }
})
