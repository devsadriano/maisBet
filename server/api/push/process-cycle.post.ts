import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'
import { processRoundPushCycles } from '../../utils/pushService'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

  const validTokens = [
    process.env.CRON_SECRET,
    process.env.SUPABASE_SECRET_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ].filter((t): t is string => Boolean(t && t.length > 0))

  const hasValidMachineToken = Boolean(token && validTokens.includes(token))
  if (!hasValidMachineToken) {
    await requireAdmin(event)
  }

  const body = await readBody(event).catch(() => ({}))
  const campeonatoId = typeof body?.campeonato_id === 'string' ? body.campeonato_id : undefined

  const supabase = await serverSupabaseServiceRole<any>(event)
  const summary = await processRoundPushCycles(supabase, campeonatoId)

  return {
    success: true,
    ...summary,
  }
})
