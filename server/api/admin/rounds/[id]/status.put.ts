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
    const updateData: any = { status: newStatus }
    if (newStatus === 'aguardando_escolha') {
      updateData.extras_escolhidos_tipo = null
      updateData.extras_escolhidos_por = null
      updateData.extras_escolhidos_em = null
    }

    const { error } = await supabase
      .from('rodadas')
      .update(updateData)
      .eq('id', id)

    if (error) {
      throw createError({ statusCode: 500, message: error.message })
    }

    if (newStatus === 'aguardando_escolha') {
      // Limpa marcações de jogos extras nas partidas para permitir seleção limpa do organizador ou admin
      await supabase.from('partidas').update({ is_extra: false }).eq('rodada_id', id)
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
