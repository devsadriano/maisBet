// server/api/admin/report.get.ts
// GET /api/admin/report?campeonato_id=...&ate_rodada_numero=...
// Gera dados completos do campeonato para exportação em PDF/Excel.
// O parâmetro `ate_rodada_numero` permite gerar um "snapshot" histórico
// do ranking até aquela rodada, ignorando tudo que veio depois.

import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = await serverSupabaseServiceRole<any>(event)

  const query = getQuery(event)
  const campeonato_id = query.campeonato_id as string
  const ate_rodada_numero = query.ate_rodada_numero ? Number(query.ate_rodada_numero) : null

  if (!campeonato_id) {
    throw createError({ statusCode: 400, message: 'campeonato_id é obrigatório.' })
  }

  // ── 1. Campeonato ─────────────────────────────────────────────────────────
  const { data: camp, error: campErr } = await supabase
    .from('campeonatos')
    .select('id, nome, api_competition_code, season, status, start_date, end_date, detalhes_premiacao, apelido_grupo, fuso_horario, scoring_systems(regras)')
    .eq('id', campeonato_id)
    .single()

  if (campErr || !camp) {
    throw createError({ statusCode: 404, message: 'Campeonato não encontrado.' })
  }

  const regras = (camp.scoring_systems as any)?.regras || { placar_exato: 3, vencedor_correto: 1, errou: 0 }

  // ── 2. Rodadas (filtradas pelo corte se informado) ────────────────────────
  let rodadasQuery = supabase
    .from('rodadas')
    .select('id, numero_rodada, status, organizer_deadline, betting_deadline, created_at, multiplicador, usuarios(id, nome, email)')
    .eq('campeonato_id', campeonato_id)
    .order('numero_rodada', { ascending: true })

  if (ate_rodada_numero !== null) {
    rodadasQuery = rodadasQuery.lte('numero_rodada', ate_rodada_numero)
  }

  const { data: rodadas } = await rodadasQuery
  const rodadasList: any[] = rodadas || []
  const rodadasIds = rodadasList.map((r: any) => r.id)
  const rodadasMap = new Map(rodadasList.map((r: any) => [r.id, r]))

  // ── 3. Partidas das rodadas filtradas ─────────────────────────────────────
  const { data: partidas } = rodadasIds.length > 0
    ? await supabase
        .from('partidas')
        .select('id, rodada_id, time_casa, time_fora, gols_casa, gols_fora, status, data_partida, is_mandatory, is_extra')
        .in('rodada_id', rodadasIds)
        .order('data_partida', { ascending: true })
    : { data: [] }

  const partidasList: any[] = partidas || []
  const partidasMap = new Map(partidasList.map((p: any) => [p.id, p]))
  const partidasIds = partidasList.map((p: any) => p.id)

  // ── 4. Participantes do campeonato ────────────────────────────────────────
  const { data: acessos } = await supabase
    .from('campeonato_acessos')
    .select('email, created_at, time_id, times(nome, escudo_url)')
    .eq('campeonato_id', campeonato_id)

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nome, email, cidade, estado, created_at')
    .eq('is_admin', false)

  const usuariosList: any[] = usuarios || []
  const acessosList: any[] = acessos || []

  // Participantes autorizados neste campeonato
  let participantes = usuariosList.filter((u: any) =>
    acessosList.some((a: any) => a.email?.toLowerCase() === u.email?.toLowerCase())
  )

  // ── 5. Palpites (apenas de partidas das rodadas filtradas) ────────────────
  const { data: palpites } = partidasIds.length > 0
    ? await supabase
        .from('palpites')
        .select('id, usuario_id, partida_id, gols_casa_bet, gols_fora_bet, pontos, created_at')
        .in('partida_id', partidasIds)
    : { data: [] }

  const palpitesList: any[] = palpites || []

  // ── Calcular Data Limite Histórica da Rodada de Corte ───────────────────
  let cutoffTime: number | null = null
  if (ate_rodada_numero !== null) {
    const targetRodada = rodadasList.find((r: any) => r.numero_rodada === ate_rodada_numero)
    if (targetRodada) {
      const partidasDaRodada = partidasList.filter((p: any) => p.rodada_id === targetRodada.id && p.data_partida)
      const timesPartidas = partidasDaRodada.map((p: any) => new Date(p.data_partida).getTime())
      const maxPartidaTime = timesPartidas.length > 0 ? Math.max(...timesPartidas) : null

      if (targetRodada.betting_deadline) {
        const betTime = new Date(targetRodada.betting_deadline).getTime()
        cutoffTime = maxPartidaTime ? Math.max(betTime, maxPartidaTime + 3 * 3600 * 1000) : betTime
      } else if (maxPartidaTime) {
        cutoffTime = maxPartidaTime + 3 * 3600 * 1000
      } else if (targetRodada.created_at) {
        cutoffTime = new Date(targetRodada.created_at).getTime()
      }
    }
  }

  // ── Filtrar Participantes Históricos até a Rodada Selecionada ────────────
  // Se houver corte por rodada (ex: até a Rodada 5), inclui apenas quem:
  // 1) Teve ao menos um palpite nas rodadas até o corte (<= ate_rodada_numero)
  // OU
  // 2) Foi cadastrado/aprovado no campeonato até a data limite da rodada escolhida
  if (ate_rodada_numero !== null) {
    const userIdsComPalpite = new Set(palpitesList.map((p: any) => p.usuario_id))

    participantes = participantes.filter((u: any) => {
      // 1. Fez algum palpite nas partidas válidas até aqui
      if (userIdsComPalpite.has(u.id)) return true

      // 2. Ou seu acesso ou usuário foram criados até a data limite da rodada de corte
      if (cutoffTime !== null) {
        const acessoUser = acessosList.find((a: any) => a.email?.toLowerCase() === u.email?.toLowerCase())
        const dataAcesso = acessoUser?.created_at ? new Date(acessoUser.created_at).getTime() : null
        const dataUsuario = u.created_at ? new Date(u.created_at).getTime() : null

        if (dataAcesso && dataAcesso <= cutoffTime) return true
        if (dataUsuario && dataUsuario <= cutoffTime) return true
      }

      return false
    })
  }

  // ── 6. Palpites Especiais ─────────────────────────────────────────────────
  const { data: palpitesEspeciais } = await supabase
    .from('palpites_especiais')
    .select('usuario_id, tipo, valor, pontos, created_at')
    .eq('campeonato_id', campeonato_id)

  let especialisList: any[] = palpitesEspeciais || []
  if (ate_rodada_numero !== null && cutoffTime !== null) {
    especialisList = especialisList.filter((s: any) => {
      const espCreated = s.created_at ? new Date(s.created_at).getTime() : null
      return !espCreated || espCreated <= cutoffTime
    })
  }

  // ── 7. Solicitações do campeonato ─────────────────────────────────────────
  const { data: solicitacoes } = await supabase
    .from('solicitacoes')
    .select('id, nome, email, cidade, estado, telefone, status, mensagem, motivo_rejeicao, created_at, resolved_at')
    .eq('campeonato_id', campeonato_id)
    .order('created_at', { ascending: false })

  let solicitacoesList: any[] = solicitacoes || []

  // Se houver corte histórico por rodada, filtrar solicitações até a data limite da rodada
  if (ate_rodada_numero !== null && cutoffTime !== null) {
    solicitacoesList = solicitacoesList
      .filter((s: any) => {
        const solCreated = s.created_at ? new Date(s.created_at).getTime() : null
        return !solCreated || solCreated <= cutoffTime
      })
      .map((s: any) => {
        // Se a solicitação foi resolvida após a data limite da rodada, na época ela ainda era pendente
        const resolvedTime = s.resolved_at ? new Date(s.resolved_at).getTime() : null
        if (resolvedTime && resolvedTime > cutoffTime) {
          return {
            ...s,
            status: 'pendente',
            motivo_rejeicao: null,
            resolved_at: null
          }
        }
        return s
      })
  }

  // ── 8. Calcular Ranking ───────────────────────────────────────────────────
  const rankingData = participantes.map((u: any) => {
    const userPalpites = palpitesList.filter((p: any) => p.usuario_id === u.id)
    const acessoUser = acessosList.find((a: any) => a.email?.toLowerCase() === u.email?.toLowerCase())

    const pontosPorRodada: Record<number, { pontos: number; palpites: number; cravados: number; acertos: number }> = {}
    let totalPontos = 0
    let totalCravados = 0
    let totalAcertos = 0

    userPalpites.forEach((p: any) => {
      const partida = partidasMap.get(p.partida_id)
      if (!partida || partida.status !== 'finalizado') return

      const rodada = rodadasMap.get(partida.rodada_id)
      if (!rodada) return

      const numRodada = rodada.numero_rodada
      const mult = Number(rodada.multiplicador) || 1
      const pontosReais = (p.pontos || 0) * mult

      if (!pontosPorRodada[numRodada]) {
        pontosPorRodada[numRodada] = { pontos: 0, palpites: 0, cravados: 0, acertos: 0 }
      }

      pontosPorRodada[numRodada].pontos += pontosReais
      pontosPorRodada[numRodada].palpites++
      totalPontos += pontosReais

      if (p.pontos === regras.placar_exato) {
        pontosPorRodada[numRodada].cravados++
        totalCravados++
      } else if (p.pontos > 0) {
        pontosPorRodada[numRodada].acertos++
        totalAcertos++
      }
    })

    // Somar especiais
    const userEspeciais = especialisList.filter((s: any) => s.usuario_id === u.id)
    userEspeciais.forEach((s: any) => { totalPontos += s.pontos || 0 })

    return {
      usuario_id: u.id,
      nome: u.nome,
      email: u.email,
      cidade: u.cidade,
      estado: u.estado,
      time_nome: acessoUser?.times?.nome || null,
      escudo_url: acessoUser?.times?.escudo_url || null,
      total_pontos: totalPontos,
      total_cravados: totalCravados,
      total_acertos: totalAcertos,
      total_palpites: userPalpites.length,
      pontos_por_rodada: pontosPorRodada,
      palpites_especiais: userEspeciais,
      position: 0
    }
  })

  // Ordenar ranking
  const rankingSorted = rankingData.sort((a: any, b: any) => {
    if (b.total_pontos !== a.total_pontos) return b.total_pontos - a.total_pontos
    if (b.total_cravados !== a.total_cravados) return b.total_cravados - a.total_cravados
    if (b.total_acertos !== a.total_acertos) return b.total_acertos - a.total_acertos
    return a.nome.localeCompare(b.nome)
  }).map((item: any, idx: number) => ({ ...item, position: idx + 1 }))

  // ── 9. Palpites detalhados por jogo ──────────────────────────────────────
  const palpitesDetalhados = palpitesList.map((p: any) => {
    const partida = partidasMap.get(p.partida_id)
    const rodada = partida ? rodadasMap.get(partida.rodada_id) : null
    const usuario = participantes.find((u: any) => u.id === p.usuario_id)
    const mult = Number(rodada?.multiplicador) || 1

    let tipo_acerto = 'Errou'
    if (p.pontos === regras.placar_exato) tipo_acerto = 'Placar Exato'
    else if (p.pontos > 0) tipo_acerto = 'Acertou Vencedor'

    return {
      id: p.id,
      partida_id: p.partida_id,
      rodada_numero: rodada?.numero_rodada || 0,
      usuario_id: p.usuario_id,
      participante: usuario?.nome || 'Desconhecido',
      participante_email: usuario?.email || '-',
      jogo: partida ? `${partida.time_casa} x ${partida.time_fora}` : 'Jogo não encontrado',
      time_casa: partida?.time_casa || '-',
      time_fora: partida?.time_fora || '-',
      palpite: `${p.gols_casa_bet} x ${p.gols_fora_bet}`,
      gols_casa_bet: p.gols_casa_bet,
      gols_fora_bet: p.gols_fora_bet,
      resultado_real: partida?.gols_casa !== null && partida?.gols_casa !== undefined ? `${partida.gols_casa} x ${partida.gols_fora}` : '-',
      gols_casa_real: partida?.gols_casa ?? null,
      gols_fora_real: partida?.gols_fora ?? null,
      status_partida: partida?.status || '-',
      pontos: p.pontos || 0,
      pontos_com_mult: (p.pontos || 0) * mult,
      tipo_acerto,
      data_palpite: p.created_at
    }
  }).sort((a: any, b: any) => a.rodada_numero - b.rodada_numero || a.participante.localeCompare(b.participante))

  // ── 10. Palpites Especiais Detalhados ────────────────────────────────────
  const palpitesEspeciaisDetalhados = especialisList.map((e: any) => {
    const usuario = participantes.find((u: any) => u.id === e.usuario_id)
    return {
      usuario_id: e.usuario_id,
      participante: usuario?.nome || 'Desconhecido',
      participante_email: usuario?.email || '-',
      tipo: e.tipo,
      valor: e.valor,
      pontos: e.pontos || 0,
      data_palpite: e.created_at
    }
  }).sort((a: any, b: any) => a.participante.localeCompare(b.participante))

  // ── 11. Organizadores por Rodada ─────────────────────────────────────────
  const organizadores = rodadasList.map((r: any) => ({
    id: r.id,
    numero_rodada: r.numero_rodada,
    status: r.status,
    organizador_id: r.usuarios?.id || null,
    organizador: r.usuarios?.nome || 'Não definido',
    email_organizador: r.usuarios?.email || '-',
    betting_deadline: r.betting_deadline,
    organizer_deadline: r.organizer_deadline,
    multiplicador: r.multiplicador || 1,
    total_partidas: partidasList.filter((p: any) => p.rodada_id === r.id).length,
    partidas_finalizadas: partidasList.filter((p: any) => p.rodada_id === r.id && p.status === 'finalizado').length
  }))

  // ── 12. Lista de participantes completa ──────────────────────────────────
  const listaParticipantes = participantes.map((u: any) => {
    const acessoUser = acessosList.find((a: any) => a.email?.toLowerCase() === u.email?.toLowerCase())
    return {
      usuario_id: u.id,
      nome: u.nome,
      email: u.email,
      cidade: u.cidade || '-',
      estado: u.estado || '-',
      time_id: acessoUser?.time_id || null,
      time_coracao: acessoUser?.times?.nome || '-',
      membro_desde: u.created_at
    }
  }).sort((a: any, b: any) => a.nome.localeCompare(b.nome))

  // ── Resposta Final ────────────────────────────────────────────────────────
  return {
    meta: {
      campeonato_nome: camp.nome,
      campeonato_id: camp.id,
      api_code: camp.api_competition_code,
      season: camp.season,
      status: camp.status,
      start_date: camp.start_date,
      end_date: camp.end_date,
      detalhes_premiacao: camp.detalhes_premiacao,
      apelido_grupo: camp.apelido_grupo,
      fuso_horario: camp.fuso_horario,
      regras_pontuacao: regras,
      ate_rodada: ate_rodada_numero !== null ? ate_rodada_numero : 'todas',
      gerado_em: new Date().toISOString(),
      total_rodadas: rodadasList.length,
      total_partidas: partidasList.length,
      total_participantes: participantes.length,
      total_palpites: palpitesList.length,
      total_especiais: palpitesEspeciaisDetalhados.length,
      total_solicitacoes: solicitacoesList.length
    },
    ranking: rankingSorted,
    rodadas: organizadores,
    partidas: partidasList.map((p: any) => {
      const rodada = rodadasMap.get(p.rodada_id)
      return {
        id: p.id,
        rodada_id: p.rodada_id,
        rodada_numero: rodada?.numero_rodada || 0,
        time_casa: p.time_casa,
        time_fora: p.time_fora,
        placar_real: p.gols_casa !== null && p.gols_casa !== undefined ? `${p.gols_casa} x ${p.gols_fora}` : '-',
        gols_casa: p.gols_casa,
        gols_fora: p.gols_fora,
        status: p.status,
        data_partida: p.data_partida,
        is_mandatory: p.is_mandatory,
        is_extra: p.is_extra
      }
    }),
    palpites_detalhados: palpitesDetalhados,
    palpites_especiais: palpitesEspeciaisDetalhados,
    solicitacoes: solicitacoesList,
    participantes: listaParticipantes
  }
})
