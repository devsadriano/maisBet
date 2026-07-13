import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../../utils/requireAdmin'

/**
 * PUT /api/admin/rounds/[id]/clear-alert
 * 
 * Limpa o alerta de alteração de calendário da rodada.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const supabase = await serverSupabaseServiceRole<any>(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID da rodada é obrigatório.' })
  }

  try {
    const { error } = await supabase
      .from('rodadas')
      .update({ calendario_alterado: false })
      .eq('id', id)

    if (error) {
      throw createError({ statusCode: 500, message: `Erro ao limpar alerta no banco: ${error.message}` })
    }

    return { success: true, message: 'Alerta limpo com sucesso.' }
  } catch (err: any) {
    console.error('Error clearing alert:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Erro interno do servidor.'
    })
  }
})
