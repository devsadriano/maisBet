import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = await serverSupabaseServiceRole<any>(event)

  try {
    // 1. Fetch active rounds (status 'aberta' or 'aguardando_escolha' or 'fechada')
    const { data: rounds, error: roundsErr } = await supabase
      .from('rodadas')
      .select('id, numero_rodada, status, campeonato_id, betting_deadline')
      .in('status', ['aberta', 'aguardando_escolha', 'fechada'])
      .order('numero_rodada', { ascending: false })

    if (roundsErr || !rounds || rounds.length === 0) {
      return { success: true, message: 'Nenhuma rodada ativa encontrada para ajustar.', updated: 0 }
    }

    const updatedRounds: any[] = []

    for (const r of rounds) {
      // 2. Fetch matches for this round sorted by data_partida
      const { data: matches } = await supabase
        .from('partidas')
        .select('data_partida, status')
        .eq('rodada_id', r.id)
        .order('data_partida', { ascending: true })

      if (!matches || matches.length === 0) continue

      // Filter out postponed matches ('adiado') when calculating round start deadline
      const activeMatches = matches.filter((m: any) => m.status !== 'adiado')
      const targetMatches = activeMatches.length > 0 ? activeMatches : matches

      const validDates = targetMatches
        .map((m: any) => new Date(m.data_partida))
        .filter((d: Date) => !isNaN(d.getTime()))

      if (validDates.length === 0) continue

      // Earliest scheduled match date
      const earliestMatch = validDates[0]
      // 1 hour before first scheduled match
      const newBettingDeadline = new Date(earliestMatch.getTime() - 1 * 3600000).toISOString()
      const newOrganizerDeadline = new Date(earliestMatch.getTime() - 1 * 3600000).toISOString()

      // If earliest match is in the future relative to current time, set status to 'aberta'
      const isFuture = earliestMatch.getTime() > Date.now()
      const newStatus = isFuture ? 'aberta' : r.status

      await supabase
        .from('rodadas')
        .update({
          betting_deadline: newBettingDeadline,
          organizer_deadline: newOrganizerDeadline,
          status: newStatus
        })
        .eq('id', r.id)

      updatedRounds.push({
        rodada: r.numero_rodada,
        firstMatch: earliestMatch.toISOString(),
        firstMatchCampoGrande: earliestMatch.toLocaleString('pt-BR', { timeZone: 'America/Campo_Grande' }),
        newDeadline: newBettingDeadline,
        newDeadlineCampoGrande: new Date(newBettingDeadline).toLocaleString('pt-BR', { timeZone: 'America/Campo_Grande' }),
        status: newStatus
      })
    }

    return {
      success: true,
      message: `Prazos recalculados para ${updatedRounds.length} rodada(s) desconsiderando jogos adiados (Fuso Campo Grande MS).`,
      updatedRounds
    }
  } catch (err: any) {
    console.error('Error in recalculate-deadlines:', err)
    throw createError({ statusCode: 500, message: err.message || 'Erro ao recalcular prazos.' })
  }
})
