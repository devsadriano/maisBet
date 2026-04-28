import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseServiceRole<any>(event)
  const { data, error } = await supabase.rpc('run_sql', { query: `SELECT pg_get_viewdef('vw_ranking', true) as def;` })
  
  if (error) {
     return { error }
  }
  return { data }
})
