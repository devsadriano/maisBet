import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  
  // Verify auth
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (authError || !session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // Check if admin
  const { data: user } = await supabase.from('usuarios').select('is_admin').eq('id', session.user.id).single()
  if (!user?.is_admin) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  try {
    // We invoke the Edge Function directly via Supabase client
    const { data, error } = await supabase.functions.invoke('auto-cycle', {
      method: 'POST'
    })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Error triggering auto-cycle:', error)
    throw createError({ statusCode: 500, message: error.message || 'Internal Server Error' })
  }
})
