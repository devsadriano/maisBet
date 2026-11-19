import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuthUser, sendPushToUser } from '../../utils/pushService'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const supabase = await serverSupabaseServiceRole<any>(event)

  const res = await sendPushToUser(supabase, user.id, 'system', {
    title: '🔔 Notificação de Teste do +BET!',
    message: 'Tudo certo por aqui! Este aparelho já está pronto para receber seus alertas do bolão.',
    url: '/palpites',
    tag: 'test-push',
  })

  if (res.sent === 0) {
    throw createError({
      statusCode: 400,
      message: 'Nenhum aparelho ativo encontrado para este usuário. Ative as notificações primeiro.',
    })
  }

  return { success: true, ...res }
})
