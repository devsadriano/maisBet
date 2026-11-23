import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuthUser } from '../../utils/pushService'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await readBody(event).catch(() => ({}))
  const supabase = await serverSupabaseServiceRole<any>(event)
  const nowIso = new Date().toISOString()

  if (body?.all === true) {
    const { error } = await supabase
      .from('user_notifications')
      .update({ read_at: nowIso })
      .eq('user_id', user.id)
      .is('read_at', null)

    if (error) {
      throw createError({ statusCode: 500, message: error.message })
    }
  } else if (typeof body?.id === 'string' && body.id.trim()) {
    const { error } = await supabase
      .from('user_notifications')
      .update({ read_at: nowIso })
      .eq('user_id', user.id)
      .eq('id', body.id.trim())
      .is('read_at', null)

    if (error) {
      throw createError({ statusCode: 500, message: error.message })
    }
  } else {
    throw createError({ statusCode: 400, message: 'Informe id ou all=true.' })
  }

  const { count: unreadCount } = await supabase
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)

  return {
    success: true,
    unreadCount: unreadCount || 0,
  }
})

