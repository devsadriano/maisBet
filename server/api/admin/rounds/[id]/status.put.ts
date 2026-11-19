import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../../utils/requireAdmin'
import { processRoundPushCycles } from '../../../../utils/pushService'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const supabase = await serverSupabaseServiceRole<any>(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const newStatus = body.status

  if (!id || !newStatus) {
    throw createError({ statusCode: 400, message: 'ID e status são obrigatórios.' })
  }

  const validStatuses = ['aguardando_escolha', 'aberta', 'fechada', 'finalizada']
  if (!validStatuses.includes(newStatus)) {
    throw createError({ statusCode: 400, message: 'Status inválido.' })
  }

  try {
    const { data: currentRound } = await supabase
      .from('rodadas')
      .select('campeonato_id, status, notificacoes_enviadas')
      .eq('id', id)
      .maybeSingle()

    const currentFlags = { ...((currentRound?.notificacoes_enviadas as Record<string, any>) || {}) }
    const updateData: any = { status: newStatus }

    if (newStatus === 'aguardando_escolha') {
      updateData.extras_escolhidos_tipo = null
      updateData.extras_escolhidos_por = null
      updateData.extras_escolhidos_em = null
      for (const k of ['org_init', 'org_notified_id', 'org_12h', 'org_6h', 'org_1h', 'bet_open', 'bet_12h', 'bet_6h', 'bet_1h', 'market_closed', 'round_finished']) {
        delete currentFlags[k]
      }
      updateData.notificacoes_enviadas = currentFlags
    } else if (newStatus === 'aberta') {
      for (const k of ['bet_12h', 'bet_6h', 'bet_1h', 'market_closed', 'round_finished']) {
        delete currentFlags[k]
      }
      if (currentRound?.status === 'fechada' || currentRound?.status === 'finalizada') {
        delete currentFlags.bet_open
      }
      updateData.notificacoes_enviadas = currentFlags
    }

    const { error } = await supabase
      .from('rodadas')
      .update(updateData)
      .eq('id', id)

    if (error) {
      throw createError({ statusCode: 500, message: error.message })
    }

    if (newStatus === 'aguardando_escolha') {
      // Limpa marcações de jogos extras nas partidas para permitir seleção limpa do organizador ou admin
      await supabase.from('partidas').update({ is_extra: false }).eq('rodada_id', id)
    }

    try {
      await processRoundPushCycles(supabase, currentRound?.campeonato_id)
    } catch (pushErr) {
      console.warn('[status.put] Falha não-bloqueante ao disparar push:', pushErr)
    }

    return { success: true, message: `Status alterado para ${newStatus} com sucesso!` }
  } catch (err: any) {
    console.error('Error changing round status:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Internal Server Error'
    })
  }
})
