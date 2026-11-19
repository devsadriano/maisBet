import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuthUser } from '../../utils/pushService'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await readBody(event)
  const supabase = await serverSupabaseServiceRole<any>(event)

  const payload = {
    user_id: user.id,
    push_enabled: body?.push_enabled !== undefined ? Boolean(body.push_enabled) : true,
    organizer_alerts: body?.organizer_alerts !== undefined ? Boolean(body.organizer_alerts) : true,
    round_alerts: body?.round_alerts !== undefined ? Boolean(body.round_alerts) : true,
    deadline_reminders: body?.deadline_reminders !== undefined ? Boolean(body.deadline_reminders) : true,
    results_alerts: body?.results_alerts !== undefined ? Boolean(body.results_alerts) : true,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { success: true, preferences: data }
})
