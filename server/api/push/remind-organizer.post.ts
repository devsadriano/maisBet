import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'
import { sendPushToUser } from '../../utils/pushService'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const rodadaId = body?.rodada_id

  if (!rodadaId) {
    throw createError({ statusCode: 400, message: 'rodada_id é obrigatório.' })
  }

  const supabase = await serverSupabaseServiceRole<any>(event)

  const { data: rodada, error } = await supabase
    .from('rodadas')
    .select('id, numero_rodada, status, organizer_id, required_extra_games, campeonato:campeonatos!campeonato_id(nome, apelido_grupo)')
    .eq('id', rodadaId)
    .single()

  if (error || !rodada) {
    throw createError({ statusCode: 404, message: 'Rodada não encontrada.' })
  }

  if (!rodada.organizer_id) {
    throw createError({ statusCode: 400, message: 'Esta rodada ainda não possui um organizador definido.' })
  }

  const camp = rodada.campeonato as any
  const campLabel = camp?.apelido_grupo ? `${camp.nome} (${camp.apelido_grupo})` : (camp?.nome || 'Bolão')

  const res = await sendPushToUser(supabase, rodada.organizer_id, 'organizer_alerts', {
    title: `👑 Lembrete do Admin: Rodada ${rodada.numero_rodada}!`,
    message: `Fala! Escolha o(s) ${rodada.required_extra_games} jogo(s) extra(s) da ${rodada.numero_rodada}ª Rodada do bolão ${campLabel} para liberar os palpites!`,
    url: '/palpites',
    tag: `org-manual-${rodada.id}`,
  })

  return {
    success: true,
    sent: res.sent,
    message:
      res.sent > 0
        ? `Alerta push enviado para ${res.sent} dispositivo(s) do organizador!`
        : 'O organizador ainda não ativou notificações push ou desabilitou alertas.',
  }
})
