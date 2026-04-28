import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const supabase = await serverSupabaseServiceRole<any>(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const newStatus = body.status

  if (!id || !newStatus) {
    throw createError({ statusCode: 400, message: 'ID e status são obrigatórios.' })
  }

  const validStatuses = ['aguardando_escolha', 'aberta', 'fechada', 'finalizada']
  if (!validStatuses.includes(newStatus)) {
    throw createError({ statusCode: 400, message: 'Status inválido.' })
  }

  try {
    const { error } = await supabase
      .from('rodadas')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      throw createError({ statusCode: 500, message: error.message })
    }

    return { success: true, message: `Status alterado para ${newStatus} com sucesso!` }
  } catch (err: any) {
    console.error('Error changing round status:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Internal Server Error'
    })
  }
})
