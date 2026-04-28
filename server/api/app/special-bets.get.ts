import { serverSupabaseClient } from '#supabase/server'
import { defineEventHandler, getQuery } from 'h3'

/**
 * Retorna os palpites especiais do usuário para um campeonato específico.
 */
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { campeonato_id } = getQuery(event)

  if (!campeonato_id) {
    throw createError({ statusCode: 400, message: 'campeonato_id é obrigatório' })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw createError({ statusCode: 401 })

  const { data, error } = await supabase
    .from('palpites_especiais')
    .select('*')
    .eq('usuario_id', user.id)
    .eq('campeonato_id', String(campeonato_id))

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
