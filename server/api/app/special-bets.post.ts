import { serverSupabaseServiceRole, serverSupabaseClient } from '#supabase/server'
import { defineEventHandler, readBody } from 'h3'

/**
 * Salva ou atualiza um palpite especial (Campeão, Artilheiro, etc).
 * Requer que o campeonato seja do formato 'copa'.
 */
export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw createError({ statusCode: 401 })

  const body = await readBody(event)
  const { campeonato_id, tipo, valor, api_team_id } = body

  if (!campeonato_id || !tipo || !valor) {
    throw createError({ statusCode: 400, message: 'Dados incompletos' })
  }

  // 1. Validar formato do campeonato e se está ativo
  const supabaseService = await serverSupabaseServiceRole(event)
  const { data: camp } = await supabaseService
    .from('campeonatos')
    .select('formato, status')
    .eq('id', campeonato_id)
    .single()

  if (!camp) throw createError({ statusCode: 404, message: 'Campeonato não encontrado' })
  if (camp.formato !== 'copa') {
    throw createError({ statusCode: 400, message: 'Este campeonato não suporta palpites especiais' })
  }
  if (camp.status !== 'ativo') {
    throw createError({ statusCode: 400, message: 'Campeonato não está ativo' })
  }

  // 2. Upsert do palpite especial
  const { data, error } = await supabaseService
    .from('palpites_especiais')
    .upsert({
      usuario_id: user.id,
      campeonato_id,
      tipo,
      valor,
      api_team_id: api_team_id || null
    }, { onConflict: 'usuario_id, campeonato_id, tipo' })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true, data }
})
