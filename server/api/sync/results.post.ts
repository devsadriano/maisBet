import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'

// O cálculo de pontos é responsabilidade EXCLUSIVA do trigger SQL `trg_calcular_pontos`.
// Este endpoint apenas atualiza o status e os gols de cada partida.
// O trigger dispara automaticamente via AFTER UPDATE OF gols_casa, gols_fora, status.

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const supabase = await serverSupabaseServiceRole<any>(event)
  const body = await readBody(event)
  const matchday = parseInt(body.matchday)
  const campeonato_id = body.campeonato_id

  if (!matchday || isNaN(matchday)) {
    throw createError({ statusCode: 400, message: 'O número da rodada (matchday) é obrigatório e deve ser numérico.' })
  }

  if (!campeonato_id) {
    throw createError({ statusCode: 400, message: 'O campeonato_id é obrigatório.' })
  }

  // Buscar dados do campeonato
  const { data: campeonatoData } = await supabase
    .from('campeonatos')
    .select('api_competition_code, season')
    .eq('id', campeonato_id)
    .single()

  if (!campeonatoData) {
    throw createError({ statusCode: 404, message: 'Campeonato não encontrado.' })
  }

  const { api_competition_code, season } = campeonatoData

  const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY
  if (!FOOTBALL_DATA_KEY) {
    throw createError({ statusCode: 500, message: 'A chave FOOTBALL_DATA_KEY não está configurada no servidor.' })
  }

  try {
    const seasonParam = season ? `&season=${season}` : ''
    const res = await fetch(`https://api.football-data.org/v4/competitions/${api_competition_code}/matches?matchday=${matchday}${seasonParam}`, {
      headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY }
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw createError({ statusCode: res.status, message: `Erro na Football-Data API: ${errorText}` })
    }

    const data = await res.json()
    const matches = data.matches || []

    if (matches.length === 0) {
      return { success: true, message: `Nenhuma partida encontrada para a rodada ${matchday}.`, updatedPartidas: 0 }
    }

    // Buscar a rodada DESTE campeonato
    const { data: rodada } = await supabase
      .from('rodadas')
      .select('id')
      .eq('numero_rodada', matchday)
      .eq('campeonato_id', campeonato_id)
      .single()

    if (!rodada) {
      throw createError({ statusCode: 404, message: `Rodada ${matchday} não encontrada para este campeonato.` })
    }

    let updatedPartidas = 0
    const errors: string[] = []

    for (const m of matches) {
      // Mapeamento canônico de status Football-Data → schema local
      // CHECK CONSTRAINT aceita apenas: 'agendado' | 'finalizado' | 'adiado'
      let localStatus: 'agendado' | 'finalizado' | 'adiado' = 'agendado'
      if (m.status === 'FINISHED' || m.status === 'AWARDED') {
        localStatus = 'finalizado'
      } else if (m.status === 'POSTPONED' || m.status === 'CANCELLED' || m.status === 'SUSPENDED') {
        localStatus = 'adiado'
      }
      // IN_PLAY, PAUSED, SCHEDULED, TIMED → continua como 'agendado'

      // Atualizar filtrando por api_match_id + rodada_id (campeonato-específico)
      const { error: matchError } = await supabase
        .from('partidas')
        .update({
          gols_casa: m.score?.fullTime?.home ?? null,
          gols_fora: m.score?.fullTime?.away ?? null,
          status: localStatus,
        })
        .eq('api_match_id', m.id)
        .eq('rodada_id', rodada.id)

      if (matchError) {
        errors.push(`match ${m.id}: ${matchError.message}`)
        console.error(`Erro ao atualizar partida ${m.id}:`, matchError)
      } else {
        updatedPartidas++
        // O trigger trg_calcular_pontos dispara automaticamente aqui no banco,
        // calculando os pontos de todos os palpites desta partida.
      }
    }

    // Após todas as atualizações, conta os palpites processados
    let palpitesSummary = { total: 0, cravados: 0, acertos: 0 }

    const { data: palpitesStats } = await supabase
      .from('palpites')
      .select('pontos, partidas!inner(rodada_id)')
      .eq('partidas.rodada_id', rodada.id)

    if (palpitesStats) {
      palpitesSummary.total = palpitesStats.length
      palpitesSummary.cravados = palpitesStats.filter((p: any) => p.pontos === 3).length
      palpitesSummary.acertos = palpitesStats.filter((p: any) => p.pontos === 1).length
    }

    const warningMsg = errors.length > 0 ? ` (${errors.length} erros: ${errors.join('; ')})` : ''

    return {
      success: errors.length === 0,
      message: `Rodada ${matchday}: ${updatedPartidas} partidas atualizadas${warningMsg}. Pontos calculados pelo banco: ${palpitesSummary.cravados} cravados, ${palpitesSummary.acertos} acertos de resultado (total: ${palpitesSummary.total} palpites processados).`,
      updatedPartidas,
      palpitesSummary,
      errors: errors.length > 0 ? errors : undefined,
    }

  } catch (err: any) {
    console.error('Error in /api/sync/results:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Internal Server Error'
    })
  }
})
