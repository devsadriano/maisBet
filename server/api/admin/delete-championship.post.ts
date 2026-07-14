import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'

/**
 * POST /api/admin/delete-championship
 * 
 * Exclui permanentemente um campeonato e todos os seus registros dependentes (palpites_especiais, solicitacoes, acessos, rodadas, partidas, palpites)
 * usando o cliente de service_role para contornar restrições de RLS.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const supabase = await serverSupabaseServiceRole<any>(event)
  const body = await readBody(event)
  const campeonato_id = body?.campeonato_id

  if (!campeonato_id) {
    throw createError({ statusCode: 400, message: 'O ID do campeonato é obrigatório (campeonato_id).' })
  }

  console.log(`[delete-championship] Excluindo campeonato ${campeonato_id} em cascata...`)

  try {
    // 1. Deletar palpites especiais vinculados
    const { error: errEsp } = await supabase.from('palpites_especiais').delete().eq('campeonato_id', campeonato_id)
    if (errEsp) throw errEsp

    // 2. Deletar solicitações vinculadas
    const { error: errSol } = await supabase.from('solicitacoes').delete().eq('campeonato_id', campeonato_id)
    if (errSol) throw errSol

    // 3. Deletar acessos vinculados
    const { error: errAce } = await supabase.from('campeonato_acessos').delete().eq('campeonato_id', campeonato_id)
    if (errAce) throw errAce

    // 4. Deletar rodadas vinculadas (isso cascateia para partidas e palpites via banco de dados)
    const { error: errRod } = await supabase.from('rodadas').delete().eq('campeonato_id', campeonato_id)
    if (errRod) throw errRod

    // 5. Deletar o campeonato em si
    const { error: errCamp } = await supabase.from('campeonatos').delete().eq('id', campeonato_id)
    if (errCamp) throw errCamp

    return { success: true, message: 'Campeonato excluído com sucesso!' }
  } catch (err: any) {
    console.error('[delete-championship] Erro ao excluir campeonato:', err)
    throw createError({
      statusCode: 500,
      message: err.message || 'Erro ao excluir o campeonato.'
    })
  }
})
