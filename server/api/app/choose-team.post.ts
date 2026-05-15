import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Autentica o jogador
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autenticado.' })
  }

  const body = await readBody(event)
  const { acesso_id, time_id } = body

  if (!acesso_id || !time_id) {
    throw createError({ statusCode: 400, statusMessage: 'acesso_id e time_id são obrigatórios.' })
  }

  const supabase = await serverSupabaseServiceRole<any>(event)

  // 2. Verifica se o acesso pertence ao e-mail do jogador logado
  const { data: acesso, error: fetchErr } = await supabase
    .from('campeonato_acessos')
    .select('id, email, time_id, campeonato_id')
    .eq('id', acesso_id)
    .single()

  if (fetchErr || !acesso) {
    throw createError({ statusCode: 404, statusMessage: 'Acesso não encontrado.' })
  }

  // Verifica se o email do acesso bate com o do jogador logado
  if (acesso.email.toLowerCase() !== user.email?.toLowerCase()) {
    throw createError({ statusCode: 403, statusMessage: 'Esse acesso não pertence a você.' })
  }

  // 3. Verifica se o time já foi escolhido (não permite trocar)
  if (acesso.time_id) {
    throw createError({ statusCode: 409, statusMessage: 'Você já escolheu um time para este campeonato.' })
  }

  // 4. Salva o time usando service role (bypassa RLS)
  const { error: updateErr } = await supabase
    .from('campeonato_acessos')
    .update({ time_id })
    .eq('id', acesso_id)

  if (updateErr) {
    throw createError({ statusCode: 500, statusMessage: `Erro ao salvar: ${updateErr.message}` })
  }

  // 5. Atualiza os jogos obrigatórios para refletir a nova seleção
  try {
    // Buscar rodadas ativas
    const { data: rodadas } = await supabase
      .from('rodadas')
      .select('id')
      .eq('campeonato_id', acesso.campeonato_id)
      .in('status', ['aberta', 'aguardando_escolha'])

    if (rodadas && rodadas.length > 0) {
      // Buscar times de todos os participantes
      const { data: acessos } = await supabase
        .from('campeonato_acessos')
        .select('times(api_team_id)')
        .eq('campeonato_id', acesso.campeonato_id)
        .not('time_id', 'is', null)

      const userTeamIds = new Set(
        acessos?.map((a: any) => a.times?.api_team_id).filter(Boolean) || []
      )

      if (userTeamIds.size > 0) {
        for (const rodada of rodadas) {
          const { data: partidas } = await supabase
            .from('partidas')
            .select('id, api_team_home_id, api_team_away_id')
            .eq('rodada_id', rodada.id)

          if (!partidas) continue

          const mandatoryIds = partidas
            .filter((p: any) => userTeamIds.has(p.api_team_home_id) || userTeamIds.has(p.api_team_away_id))
            .map((p: any) => p.id)

          if (mandatoryIds.length > 0) {
            await supabase.from('partidas').update({ is_mandatory: true }).in('id', mandatoryIds)
          }
        }
      }
    }
  } catch (e) {
    console.error('Falha ao recalcular partidas obrigatórias:', e)
  }

  return { success: true, message: 'Time salvo com sucesso!' }
})
