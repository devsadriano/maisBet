import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const email = 'adriano.roch@gmail.com'

  const query = supabase
    .from('campeonatos')
    .select(`
      *,
      scoring_system:scoring_systems(*),
      campeonato_acessos!inner(id)
    `)
    .eq('status', 'ativo')
    .eq('campeonato_acessos.email', email)
    .order('created_at', { ascending: false })

  const { data, error } = await query

  return {
    email,
    data,
    error
  }
})
