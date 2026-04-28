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
    await $fetch('/api/app/fix-mandatory', {
      method: 'POST',
      body: { campeonato_id: acesso.campeonato_id }
    })
  } catch (e) {
    console.error('Falha ao recalcular partidas obrigatórias:', e)
  }

  return { success: true, message: 'Time salvo com sucesso!' }
})
