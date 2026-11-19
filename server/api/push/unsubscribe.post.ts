import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuthUser } from '../../utils/pushService'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await readBody(event)
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : ''

  if (!endpoint) {
    throw createError({ statusCode: 400, message: 'Endpoint é obrigatório para cancelar inscrição.' })
  }

  const supabase = await serverSupabaseServiceRole<any>(event)
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { success: true }
})
