import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuthUser } from '../../utils/pushService'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const supabase = await serverSupabaseServiceRole<any>(event)

  const [{ data: prefs }, { count: activeDevices }] = await Promise.all([
    supabase
      .from('notification_preferences')
      .select('user_id, push_enabled, organizer_alerts, round_alerts, deadline_reminders, results_alerts, updated_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('disabled_at', null),
  ])

  return {
    preferences: prefs || {
      user_id: user.id,
      push_enabled: true,
      organizer_alerts: true,
      round_alerts: true,
      deadline_reminders: true,
      results_alerts: true,
    },
    activeDevices: activeDevices || 0,
  }
})
