import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  // Proteção Server-side Rígida: 
  // 1. Requer sessão ativa no H3 event
  // 2. Requer is_admin = true checado via service_role bypassing RLS
  await requireAdmin(event)

  const supabase = await serverSupabaseServiceRole<any>(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id || !body.organizer_id) {
    throw createError({
      statusCode: 400,
      message: 'ID da rodada e novo organizer_id são obrigatórios'
    })
  }

  // Permite mudar mas *não* reinicia o status! O status atual é mantido.
  // Pode ser feito inclusive antes do organizador antigo ter escolhido.
  const { data, error } = await supabase
    .from('rodadas')
    .update({ 
      organizer_id: body.organizer_id,
      // Status volta para aguardando_escolha caso a rodada ainda não tenha começado formalmente?
      // Neste caso, deixaremos o status intocado, ou o admin força o status manualmente depois.
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }

  return { success: true, round: data }
})
