import { defineEventHandler, createError, getQuery } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseServiceRole<any>(event)
  const query = getQuery(event)
  const campeonato_id = query.campeonato_id as string

  if (!campeonato_id) {
    throw createError({
      statusCode: 400,
      message: 'O campeonato_id é obrigatório.'
    })
  }

  // 1. Fetch all rounds for this championship
  const { data: rodadas, error: errorRodadas } = await supabase
    .from('rodadas')
    .select('*')
    .eq('campeonato_id', campeonato_id)
    .order('numero_rodada', { ascending: true })

  if (errorRodadas) {
    throw createError({
      statusCode: 500,
      message: `Erro ao carregar rodadas: ${errorRodadas.message}`
    })
  }

  // 2. Fetch all access/participants for this championship
  const { data: acessos, error: errorAcessos } = await supabase
    .from('campeonato_acessos')
    .select('id, created_at, email, time_id, times(nome)')
    .eq('campeonato_id', campeonato_id)

  if (errorAcessos) {
    throw createError({
      statusCode: 500,
      message: `Erro ao carregar acessos: ${errorAcessos.message}`
    })
  }

  // 3. Fetch all users to map them in memory
  const { data: users, error: errorUsers } = await supabase
    .from('usuarios')
    .select('id, nome, email, is_admin')

  if (errorUsers) {
    throw createError({
      statusCode: 500,
      message: `Erro ao carregar usuários: ${errorUsers.message}`
    })
  }

  // Create a map of email to user for quick lookup
  const userByEmail = new Map<string, any>()
  const userById = new Map<string, any>()
  users?.forEach(u => {
    userByEmail.set(u.email.toLowerCase(), u)
    userById.set(u.id, u)
  })

  // Map participants (only active non-admins in this championship)
  const participants = (acessos || []).map((a: any) => {
    const u = userByEmail.get(a.email.toLowerCase())
    if (!u) return null
    return {
      id: u.id,
      nome: u.nome,
      email: a.email,
      is_admin: u.is_admin,
      created_at: a.created_at,
      time_nome: a.times?.nome || 'Sem Time'
    }
  }).filter((p: any) => p && !p.is_admin)

  // 4. Calculate historic state for each round
  const auditReport = (rodadas || []).map((round: any) => {
    const roundCreatedAt = new Date(round.created_at).getTime()

    // Filter participants active at/before round creation
    let activeParticipants = participants.filter((p: any) => {
      if (!p.created_at) return true
      return new Date(p.created_at).getTime() <= roundCreatedAt
    })

    // Fail-safe: if no participants were registered before round creation,
    // fall back to all participants of the championship
    if (activeParticipants.length === 0) {
      activeParticipants = participants
    }

    // Calculate historic stats of rounds organized *before* this round
    const candidates = activeParticipants.map((p: any) => {
      // Find rounds of this championship strictly before the current round
      const roundsBefore = (rodadas || []).filter((r: any) => {
        return r.numero_rodada < round.numero_rodada && r.organizer_id === p.id
      })

      const roundCount = roundsBefore.length
      const lastRound = roundsBefore.reduce((max: number, r: any) => {
        return r.numero_rodada > max ? r.numero_rodada : max
      }, 0)

      return {
        id: p.id,
        nome: p.nome,
        email: p.email,
        time_nome: p.time_nome,
        round_count: roundCount,
        last_round: lastRound || null,
        is_organizer: round.organizer_id === p.id
      }
    })

    // Sort candidates according to the rule:
    // 1. Least rounds organized (round_count ASC)
    // 2. Organized longest ago (last_round ASC)
    // 3. Alphabetical order (nome ASC)
    candidates.sort((a: any, b: any) => {
      if (a.round_count !== b.round_count) {
        return a.round_count - b.round_count
      }
      const lastRoundA = a.last_round || 0
      const lastRoundB = b.last_round || 0
      if (lastRoundA !== lastRoundB) {
        return lastRoundA - lastRoundB
      }
      return a.nome.localeCompare(b.nome, 'pt-BR')
    })

    // Find the organizer details
    const organizerUser = round.organizer_id ? userById.get(round.organizer_id) : null
    const organizer = organizerUser ? {
      id: organizerUser.id,
      nome: (organizerUser.is_admin || organizerUser.nome === 'ADRIANO ADMIN') ? 'Administrador' : organizerUser.nome,
      email: organizerUser.email,
      time_nome: participants.find((p: any) => p.id === organizerUser.id)?.time_nome || 'Sem Time'
    } : null

    // Rule was followed if organizer matches the top candidate (or if there is no organizer/candidates)
    const firstCandidateId = candidates[0]?.id || null
    const ruleFollowed = organizer ? organizer.id === firstCandidateId : true

    return {
      id: round.id,
      numero_rodada: round.numero_rodada,
      status: round.status,
      created_at: round.created_at,
      total_participants: activeParticipants.length,
      organizer,
      rule_followed: ruleFollowed,
      candidates
    }
  })

  return {
    success: true,
    campeonato_id,
    auditReport
  }
})
