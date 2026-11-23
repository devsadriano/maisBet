import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuthUser } from '../../utils/pushService'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const supabase = await serverSupabaseServiceRole<any>(event)

  const [{ data: notifications, error: listErr }, { count: unreadCount, error: countErr }] =
    await Promise.all([
      supabase
        .from('user_notifications')
        .select('id, user_id, category, title, message, url, read_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('user_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null),
    ])

  if (listErr) {
    throw createError({ statusCode: 500, message: listErr.message })
  }

  if (countErr) {
    throw createError({ statusCode: 500, message: countErr.message })
  }

  return {
    notifications: notifications || [],
    unreadCount: unreadCount || 0,
  }
})

