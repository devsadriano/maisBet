import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuthUser, detectDeviceLabel } from '../../utils/pushService'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await readBody(event)

  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : ''
  const p256dh = typeof body?.keys?.p256dh === 'string' ? body.keys.p256dh.trim() : ''
  const auth = typeof body?.keys?.auth === 'string' ? body.keys.auth.trim() : ''

  if (!endpoint || !p256dh || !auth) {
    throw createError({ statusCode: 400, message: 'Dados da PushSubscription inválidos.' })
  }

  try {
    new URL(endpoint)
  } catch {
    throw createError({ statusCode: 400, message: 'Endpoint de push inválido.' })
  }

  const userAgent = getHeader(event, 'user-agent') || ''
  const deviceLabel =
    typeof body?.device_label === 'string' && body.device_label.trim()
      ? body.device_label.trim().slice(0, 80)
      : detectDeviceLabel(userAgent)

  const supabase = await serverSupabaseServiceRole<any>(event)
  const nowIso = new Date().toISOString()

  const { data: sub, error: subErr } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent.slice(0, 500) || null,
        device_label: deviceLabel,
        disabled_at: null,
        updated_at: nowIso,
      },
      { onConflict: 'endpoint' }
    )
    .select('id, device_label, updated_at')
    .single()

  if (subErr) {
    throw createError({ statusCode: 500, message: subErr.message })
  }

  // Garante existência de preferências padrão sem sobrescrever escolhas anteriores
  await supabase
    .from('notification_preferences')
    .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })

  return { success: true, subscription: sub }
})
