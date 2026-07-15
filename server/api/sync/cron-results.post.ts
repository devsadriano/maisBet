import { defineEventHandler, createError, getHeader } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Autenticação via CRON_SECRET enviada pela Vercel no Header Authorization
  const authHeader = getHeader(event, 'Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[cron-results] Tentativa de acesso não autorizada.')
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // 2. Instancia o Supabase com Service Role para poder invocar a Edge Function
  const supabase = await serverSupabaseServiceRole<any>(event)
  
  try {
    console.log('[cron-results] Disparando Edge Function auto-cycle...')
    const { data, error } = await supabase.functions.invoke('auto-cycle', {
      method: 'POST'
    })

    if (error) {
      throw error
    }

    console.log('[cron-results] Ciclo concluído com sucesso.')
    return {
      success: true,
      message: 'Ciclo de automação (auto-cycle) executado com sucesso.',
      data
    }
  } catch (err: any) {
    console.error('[cron-results] Erro ao invocar auto-cycle:', err)
    throw createError({
      statusCode: 500,
      message: err.message || 'Erro interno ao processar automação.'
    })
  }
})
