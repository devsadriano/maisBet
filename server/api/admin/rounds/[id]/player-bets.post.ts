import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  // 1. Garantir que apenas Admin autenticado pode executar
  await requireAdmin(event)

  const rodadaId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { usuario_id, palpites } = body || {}

  if (!rodadaId || !usuario_id || !palpites) {
    throw createError({
      statusCode: 400,
      message: 'ID da rodada, usuario_id e a lista de palpites são obrigatórios.'
    })
  }

  const supabase = await serverSupabaseServiceRole<any>(event)

  // 2. Validar que o jogador existe e não é admin
  const { data: jogador, error: userErr } = await supabase
    .from('usuarios')
    .select('id, nome, is_admin')
    .eq('id', usuario_id)
    .single()

  if (userErr || !jogador) {
    throw createError({ statusCode: 404, message: 'Jogador não encontrado.' })
  }

  if (jogador.is_admin) {
    throw createError({ statusCode: 400, message: 'Administradores não podem receber palpites.' })
  }

  // 3. Buscar as partidas da rodada para validação de integridade
  const { data: partidas, error: partidasErr } = await supabase
    .from('partidas')
    .select('id')
    .eq('rodada_id', rodadaId)

  if (partidasErr || !partidas || partidas.length === 0) {
    throw createError({ statusCode: 404, message: 'Nenhuma partida encontrada nesta rodada.' })
  }

  const roundMatchIds = new Set(partidas.map((p: any) => p.id))

  // 4. Montar os payloads de palpites
  const payloads: Array<{
    usuario_id: string
    partida_id: string
    gols_casa: number
    gols_fora: number
  }> = []

  // Suporta tanto formato de Array [{ partida_id, gols_casa, gols_fora }] quanto de Objeto { [partida_id]: { gols_casa_bet, gols_fora_bet } }
  if (Array.isArray(palpites)) {
    for (const item of palpites) {
      if (roundMatchIds.has(item.partida_id)) {
        payloads.push({
          usuario_id,
          partida_id: item.partida_id,
          gols_casa: Number(item.gols_casa ?? item.gols_casa_bet ?? 0),
          gols_fora: Number(item.gols_fora ?? item.gols_fora_bet ?? 0)
        })
      }
    }
  } else if (typeof palpites === 'object') {
    for (const [partidaId, val] of Object.entries<any>(palpites)) {
      if (roundMatchIds.has(partidaId)) {
        payloads.push({
          usuario_id,
          partida_id: partidaId,
          gols_casa: Number(val?.gols_casa ?? val?.gols_casa_bet ?? 0),
          gols_fora: Number(val?.gols_fora ?? val?.gols_fora_bet ?? 0)
        })
      }
    }
  }

  if (payloads.length === 0) {
    throw createError({ statusCode: 400, message: 'Nenhum palpite válido para as partidas desta rodada.' })
  }

  // 5. Salvar via Service Role (bypassa RLS)
  const { error: upsertErr } = await supabase
    .from('palpites')
    .upsert(payloads, { onConflict: 'usuario_id, partida_id' })

  if (upsertErr) {
    console.error('Erro ao salvar palpites pelo admin:', upsertErr)
    throw createError({ statusCode: 500, message: `Erro ao salvar: ${upsertErr.message}` })
  }

  return {
    success: true,
    message: `Palpites salvos com sucesso em nome de ${jogador.nome}! (${payloads.length} confrontos)`,
    count: payloads.length,
    jogador: {
      id: jogador.id,
      nome: jogador.nome
    }
  }
})
