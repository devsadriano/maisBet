import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuthUser, sendPushToUsers, sendPushToUser } from '../../utils/pushService'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await readBody(event)
  const action = body?.action as 'new_request' | 'approved'
  const campeonatoId = body?.campeonato_id as string | undefined

  const supabase = await serverSupabaseServiceRole<any>(event)

  let campLabel = 'Bolão +BET'
  if (campeonatoId) {
    const { data: camp } = await supabase
      .from('campeonatos')
      .select('nome, apelido_grupo')
      .eq('id', campeonatoId)
      .maybeSingle()
    if (camp) {
      campLabel = camp.apelido_grupo ? `${camp.nome} (${camp.apelido_grupo})` : camp.nome
    }
  }

  if (action === 'new_request') {
    const { data: admins } = await supabase
      .from('usuarios')
      .select('id')
      .eq('is_admin', true)

    const adminIds = (admins || []).map((a: any) => a.id)
    const requesterName = typeof body?.nome === 'string' && body.nome.trim() ? body.nome.trim() : 'Um competidor'

    const res = await sendPushToUsers(supabase, adminIds, 'system', {
      title: '🔔 Nova Solicitação no +BET!',
      message: `${requesterName} solicitou acesso ao bolão ${campLabel}. Toque para aprovar ou recusar.`,
      url: '/admin/solicitacoes',
      tag: `new-req-${campeonatoId || 'sys'}`,
    })
    return { success: true, ...res }
  }

  if (action === 'approved') {
    // Apenas administradores podem notificar aprovação de outro usuário
    const { data: caller } = await supabase
      .from('usuarios')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (caller?.is_admin !== true) {
      throw createError({ statusCode: 403, message: 'Acesso restrito a administradores.' })
    }

    const targetUserId = body?.target_user_id as string | undefined
    if (!targetUserId) return { success: true, sent: 0 }

    const res = await sendPushToUser(supabase, targetUserId, 'system', {
      title: '✅ Acesso Liberado no +BET!',
      message: `Bem-vindo ao bolão ${campLabel}! Escolha seu time do coração e comece a palpitar.`,
      url: '/',
      tag: `approved-${campeonatoId || 'sys'}`,
    })
    return { success: true, ...res }
  }

  throw createError({ statusCode: 400, message: 'Ação inválida.' })
})
