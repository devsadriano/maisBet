import webpush from 'web-push'
import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import { serverSupabaseClient } from '#supabase/server'
import type { NotificationCategory, PushPayload } from '~~/shared/types/PushNotification'

export async function requireAuthUser(event: H3Event) {
  const client = await serverSupabaseClient(event)
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) {
    throw createError({ statusCode: 401, message: 'Autenticação necessária.' })
  }
  return user
}

export function detectDeviceLabel(userAgent: string): string {
  const ua = userAgent || ''
  const os = /Android/i.test(ua)
    ? 'Android'
    : /iPhone|iPad|iPod/i.test(ua)
      ? 'iPhone / iOS'
      : /Windows/i.test(ua)
        ? 'Windows'
        : /Mac OS/i.test(ua)
          ? 'Mac'
          : /Linux/i.test(ua)
            ? 'Linux'
            : 'Dispositivo'

  const browser = /Edg\//i.test(ua)
    ? 'Edge'
    : /OPR\//i.test(ua)
      ? 'Opera'
      : /Chrome\//i.test(ua)
        ? 'Chrome'
        : /Firefox\//i.test(ua)
          ? 'Firefox'
          : /Safari\//i.test(ua)
            ? 'Safari'
            : 'Navegador'

  return `${os} / ${browser}`
}

interface ParticipantInfo {
  id: string
  nome: string
  email: string
}

interface PushSendResult {
  sent: number
  failed: number
  cleaned: number
}

interface CycleSummary {
  notificationsSent: number
  roundsUpdated: number
  events: string[]
}

let vapidConfigured = false

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true

  let publicKey = process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || ''
  let privateKey = process.env.VAPID_PRIVATE_KEY || ''
  let subject = process.env.VAPID_SUBJECT || 'mailto:admin@maisbet.vercel.app'

  try {
    const config = useRuntimeConfig()
    if (!publicKey) publicKey = (config.public?.vapidPublicKey as string) || ''
    if (!privateKey) privateKey = (config.vapidPrivateKey as string) || ''
    if (config.vapidSubject) subject = config.vapidSubject as string
  } catch {
    // Fallback para execuções fora do contexto Nitro
  }

  if (!publicKey || !privateKey) {
    console.warn('[PushService] Chaves VAPID não configuradas. Disparos push desativados.')
    return false
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidConfigured = true
  return true
}

function formatDeadline(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return 'breve'
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      timeZone,
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}

function getTimeWindow(deadlineIso: string | null | undefined, nowMs: number): '1h' | '6h' | '12h' | null {
  if (!deadlineIso) return null
  const diffMs = new Date(deadlineIso).getTime() - nowMs
  const hoursLeft = diffMs / 3600000
  if (hoursLeft <= 0) return null
  if (hoursLeft <= 1.25) return '1h'
  if (hoursLeft <= 6.25) return '6h'
  if (hoursLeft <= 12.25) return '12h'
  return null
}

/**
 * Envia notificação Web Push em lote para uma lista de usuários,
 * respeitando as preferências individuais e limpando subscriptions 404/410.
 */
export async function sendPushToUsers(
  supabase: SupabaseClient<any>,
  userIds: string[],
  category: NotificationCategory,
  payloadOrBuilder: PushPayload | ((userId: string) => PushPayload | null)
): Promise<PushSendResult> {
  const result: PushSendResult = { sent: 0, failed: 0, cleaned: 0 }
  const uniqueIds = [...new Set(userIds.filter(Boolean))]
  if (uniqueIds.length === 0) return result
  if (!ensureVapidConfigured()) return result

  // 1. Filtra usuários com preferência habilitada (padrão = true quando sem registro)
  let eligibleIds = uniqueIds
  if (category !== 'system') {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('user_id, push_enabled, organizer_alerts, round_alerts, deadline_reminders, results_alerts')
      .in('user_id', uniqueIds)

    const prefMap = new Map<string, any>((prefs || []).map((p: any) => [p.user_id, p]))
    eligibleIds = uniqueIds.filter((uid) => {
      const p = prefMap.get(uid)
      if (!p) return true
      if (p.push_enabled === false) return false
      return p[category] !== false
    })
  }

  if (eligibleIds.length === 0) return result

  // 2. Busca todas as subscriptions ativas em 1 query única
  const { data: subs, error: subErr } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', eligibleIds)
    .is('disabled_at', null)

  if (subErr || !subs || subs.length === 0) return result

  const payloadCache = new Map<string, PushPayload | null>()
  const invalidIds: string[] = []
  const usedIds: string[] = []

  await Promise.allSettled(
    subs.map(async (sub: any) => {
      let payload: PushPayload | null
      if (typeof payloadOrBuilder === 'function') {
        if (!payloadCache.has(sub.user_id)) {
          payloadCache.set(sub.user_id, payloadOrBuilder(sub.user_id))
        }
        payload = payloadCache.get(sub.user_id) ?? null
      } else {
        payload = payloadOrBuilder
      }

      if (!payload) return

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            icon: '/img/icon-192.png',
            badge: '/img/icon-192.png',
            url: '/palpites',
            ...payload,
          })
        )
        result.sent++
        usedIds.push(sub.id)
      } catch (err: any) {
        result.failed++
        const statusCode = err?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          invalidIds.push(sub.id)
        } else {
          console.warn(`[PushService] Falha ao enviar push (${statusCode || 'ERR'}) para sub ${sub.id}:`, err?.message)
        }
      }
    })
  )

  // 3. Auto-limpeza de subscriptions expiradas/revogadas
  if (invalidIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', invalidIds)
    result.cleaned = invalidIds.length
  }

  if (usedIds.length > 0) {
    await supabase
      .from('push_subscriptions')
      .update({ last_used_at: new Date().toISOString() })
      .in('id', usedIds)
  }

  return result
}

export async function sendPushToUser(
  supabase: SupabaseClient<any>,
  userId: string,
  category: NotificationCategory,
  payload: PushPayload
): Promise<PushSendResult> {
  return sendPushToUsers(supabase, [userId], category, payload)
}

/**
 * Resolve participantes não-admin inscritos em um campeonato específico.
 */
export async function getChampionshipParticipants(
  supabase: SupabaseClient<any>,
  campeonatoId: string
): Promise<ParticipantInfo[]> {
  const { data: acessos } = await supabase
    .from('campeonato_acessos')
    .select('email')
    .eq('campeonato_id', campeonatoId)

  const emailSet = new Set((acessos || []).map((a: any) => a.email?.toLowerCase()).filter(Boolean))
  if (emailSet.size === 0) return []

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nome, email')
    .eq('is_admin', false)

  return (usuarios || []).filter((u: any) => emailSet.has(u.email?.toLowerCase()))
}

function getValidMatchIdsForRound(matches: any[], formato: string | null): string[] {
  const isCopa = formato === 'copa'
  const hasFlags = matches.some((m) => m.is_mandatory || m.is_extra)
  const scoped = hasFlags && !isCopa ? matches.filter((m) => m.is_mandatory || m.is_extra) : matches
  const nowMs = Date.now()
  return scoped
    .filter((m) => m.status === 'agendado' && new Date(m.data_partida).getTime() > nowMs)
    .map((m) => m.id)
}

/**
 * Motor idempotente de notificações de rodadas:
 * - Convocação e régua 12h/6h/1h do Organizador
 * - Abertura da rodada e mudança de calendário CBF
 * - Régua 12h/6h/1h para apostadores com palpites pendentes
 * - Palpites revelados no fechamento do mercado
 * - Alerta de Cravada por partida encerrada
 * - Fechamento personalizado da rodada com pontuação e posição no Ranking Geral
 */
export async function processRoundPushCycles(
  supabase: SupabaseClient<any>,
  filterCampeonatoId?: string
): Promise<CycleSummary> {
  const summary: CycleSummary = { notificationsSent: 0, roundsUpdated: 0, events: [] }
  if (!ensureVapidConfigured()) return summary

  let campQuery = supabase
    .from('campeonatos')
    .select('id, nome, apelido_grupo, formato, fuso_horario, scoring_systems(regras)')
    .eq('status', 'ativo')

  if (filterCampeonatoId) {
    campQuery = campQuery.eq('id', filterCampeonatoId)
  }

  const { data: camps } = await campQuery
  if (!camps || camps.length === 0) return summary

  const nowMs = Date.now()

  for (const camp of camps) {
    const campLabel = camp.apelido_grupo ? `${camp.nome} (${camp.apelido_grupo})` : camp.nome
    const timeZone = camp.fuso_horario || 'America/Campo_Grande'
    const participants = await getChampionshipParticipants(supabase, camp.id)
    if (participants.length === 0) continue

    const participantIds = participants.map((p) => p.id)
    const participantMap = new Map(participants.map((p) => [p.id, p]))

    // Busca rodadas em andamento e as 2 últimas finalizadas (para cravadas/fechamento pendente)
    const [{ data: activeRounds }, { data: finishedRounds }] = await Promise.all([
      supabase
        .from('rodadas')
        .select('id, numero_rodada, status, organizer_id, organizer_deadline, betting_deadline, required_extra_games, calendario_alterado, notificacoes_enviadas, multiplicador')
        .eq('campeonato_id', camp.id)
        .in('status', ['aguardando_escolha', 'aberta', 'fechada'])
        .order('numero_rodada', { ascending: true }),
      supabase
        .from('rodadas')
        .select('id, numero_rodada, status, organizer_id, organizer_deadline, betting_deadline, required_extra_games, calendario_alterado, notificacoes_enviadas, multiplicador')
        .eq('campeonato_id', camp.id)
        .eq('status', 'finalizada')
        .order('numero_rodada', { ascending: false })
        .limit(2),
    ])

    const rounds = [...(activeRounds || []), ...(finishedRounds || [])]
    if (rounds.length === 0) continue

    for (const round of rounds) {
      const flags: Record<string, any> = { ...(round.notificacoes_enviadas || {}) }
      let dirty = false
      let justSentOrgInit = false
      let justSentBetOpen = false

      // 1. Organizador: convocação + régua 12h / 6h / 1h
      if (round.status === 'aguardando_escolha' && camp.formato !== 'copa' && round.organizer_id) {
        const orgUser = participantMap.get(round.organizer_id)
        const orgFirstName = (orgUser?.nome || 'Organizador').split(' ')[0]
        const orgDeadlineStr = formatDeadline(round.organizer_deadline, timeZone)

        if (!flags.org_init || flags.org_notified_id !== round.organizer_id) {
          const res = await sendPushToUser(supabase, round.organizer_id, 'organizer_alerts', {
            title: '👑 Você é o Organizador da Rodada!',
            message: `Fala, ${orgFirstName}! Escolha o(s) ${round.required_extra_games} jogo(s) extra(s) da ${round.numero_rodada}ª Rodada do bolão ${campLabel} até ${orgDeadlineStr}.`,
            url: '/palpites',
            tag: `org-init-${round.id}`,
          })
          summary.notificationsSent += res.sent
          summary.events.push(`org_init:R${round.numero_rodada}:${campLabel}:${res.sent}`)
          flags.org_init = true
          flags.org_notified_id = round.organizer_id
          dirty = true
          justSentOrgInit = true
        }

        const orgWindow = !justSentOrgInit ? getTimeWindow(round.organizer_deadline, nowMs) : null
        if (orgWindow === '1h' && !flags.org_1h) {
          const res = await sendPushToUser(supabase, round.organizer_id, 'organizer_alerts', {
            title: '🚨 ÚLTIMA CHAMADA, Organizador (1h)!',
            message: `Falta só 1 hora! Escolha agora os jogos extras da ${round.numero_rodada}ª Rodada (${campLabel}) ou o sistema fará o sorteio automático!`,
            url: '/palpites',
            tag: `org-1h-${round.id}`,
          })
          summary.notificationsSent += res.sent
          summary.events.push(`org_1h:R${round.numero_rodada}:${res.sent}`)
          flags.org_1h = true
          flags.org_6h = true
          flags.org_12h = true
          dirty = true
        } else if (orgWindow === '6h' && !flags.org_6h) {
          const res = await sendPushToUser(supabase, round.organizer_id, 'organizer_alerts', {
            title: '⚠️ Atenção, Organizador: faltam 6h!',
            message: `O prazo está correndo! Defina os jogos extras da ${round.numero_rodada}ª Rodada (${campLabel}) antes que o tempo acabe.`,
            url: '/palpites',
            tag: `org-6h-${round.id}`,
          })
          summary.notificationsSent += res.sent
          summary.events.push(`org_6h:R${round.numero_rodada}:${res.sent}`)
          flags.org_6h = true
          flags.org_12h = true
          dirty = true
        } else if (orgWindow === '12h' && !flags.org_12h) {
          const res = await sendPushToUser(supabase, round.organizer_id, 'organizer_alerts', {
            title: '⏳ Organizador: faltam 12 horas!',
            message: `A galera do bolão ${campLabel} está esperando! Escolha o(s) jogo(s) extra(s) da ${round.numero_rodada}ª Rodada para liberar os palpites.`,
            url: '/palpites',
            tag: `org-12h-${round.id}`,
          })
          summary.notificationsSent += res.sent
          summary.events.push(`org_12h:R${round.numero_rodada}:${res.sent}`)
          flags.org_12h = true
          dirty = true
        }
      }

      // 2. Rodada Aberta: abertura + mudança CBF + régua 12h / 6h / 1h apenas para pendentes
      if (round.status === 'aberta') {
        const betDeadlineStr = formatDeadline(round.betting_deadline, timeZone)

        if (!flags.bet_open) {
          const res = await sendPushToUsers(supabase, participantIds, 'round_alerts', {
            title: `⚽ ${round.numero_rodada}ª Rodada Aberta para Palpites!`,
            message: `Os jogos da ${round.numero_rodada}ª Rodada no bolão ${campLabel} já foram definidos! Mercado aberto até ${betDeadlineStr}. Faça seus palpites!`,
            url: '/palpites',
            tag: `round-open-${round.id}`,
          })
          summary.notificationsSent += res.sent
          summary.events.push(`bet_open:R${round.numero_rodada}:${campLabel}:${res.sent}`)
          flags.bet_open = true
          dirty = true
          justSentBetOpen = true
        }

        if (round.calendario_alterado === true && flags.calendario_deadline !== round.betting_deadline) {
          const res = await sendPushToUsers(supabase, participantIds, 'round_alerts', {
            title: `⚠️ Mudança no Calendário da ${round.numero_rodada}ª Rodada!`,
            message: `A CBF alterou o horário dos jogos! O novo prazo de fechamento do bolão ${campLabel} agora é ${betDeadlineStr}.`,
            url: '/palpites',
            tag: `cal-change-${round.id}`,
          })
          summary.notificationsSent += res.sent
          summary.events.push(`calendario:R${round.numero_rodada}:${res.sent}`)
          flags.calendario_alert = true
          flags.calendario_deadline = round.betting_deadline
          dirty = true
        }

        const betWindow = !justSentBetOpen ? getTimeWindow(round.betting_deadline, nowMs) : null
        const needsBetReminder =
          (betWindow === '1h' && !flags.bet_1h) ||
          (betWindow === '6h' && !flags.bet_6h) ||
          (betWindow === '12h' && !flags.bet_12h)

        if (needsBetReminder && betWindow) {
          const { data: roundMatches } = await supabase
            .from('partidas')
            .select('id, status, data_partida, is_mandatory, is_extra')
            .eq('rodada_id', round.id)

          const validMatchIds = getValidMatchIdsForRound(roundMatches || [], camp.formato)
          if (validMatchIds.length > 0) {
            const { data: existingBets } = await supabase
              .from('palpites')
              .select('usuario_id, partida_id')
              .in('partida_id', validMatchIds)

            const betCounts = new Map<string, number>()
            for (const b of existingBets || []) {
              betCounts.set(b.usuario_id, (betCounts.get(b.usuario_id) || 0) + 1)
            }

            const pendingIds = participantIds.filter((uid) => (betCounts.get(uid) || 0) < validMatchIds.length)
            if (pendingIds.length > 0) {
              const res = await sendPushToUsers(supabase, pendingIds, 'deadline_reminders', (uid) => {
                const missing = validMatchIds.length - (betCounts.get(uid) || 0)
                if (betWindow === '1h') {
                  return {
                    title: '🚨 ÚLTIMA HORA! Mercado fecha em 1h!',
                    message: `Corra! O mercado da ${round.numero_rodada}ª Rodada (${campLabel}) fecha em 1h e faltam ${missing} jogo(s). Salve agora para não zerar!`,
                    url: '/palpites',
                    tag: `bet-1h-${round.id}`,
                  }
                }
                if (betWindow === '6h') {
                  return {
                    title: '⚠️ Faltam 6h e você tem palpite pendente!',
                    message: `O fechamento da ${round.numero_rodada}ª Rodada (${campLabel}) está chegando! Faltam ${missing} jogo(s) para você completar seus palpites.`,
                    url: '/palpites',
                    tag: `bet-6h-${round.id}`,
                  }
                }
                return {
                  title: '⏳ Faltam 12h para fechar os palpites!',
                  message: `Você ainda tem ${missing} jogo(s) sem palpite na ${round.numero_rodada}ª Rodada do bolão ${campLabel}. Não deixe para a última hora!`,
                  url: '/palpites',
                  tag: `bet-12h-${round.id}`,
                }
              })
              summary.notificationsSent += res.sent
              summary.events.push(`bet_${betWindow}:R${round.numero_rodada}:${res.sent}`)
            }
          }

          if (betWindow === '1h') {
            flags.bet_1h = true
            flags.bet_6h = true
            flags.bet_12h = true
          } else if (betWindow === '6h') {
            flags.bet_6h = true
            flags.bet_12h = true
          } else {
            flags.bet_12h = true
          }
          dirty = true
        }
      }

      // 3. Palpites Revelados quando o mercado fecha
      if (round.status === 'fechada' && !flags.market_closed) {
        const res = await sendPushToUsers(supabase, participantIds, 'round_alerts', {
          title: '🔓 Mercado Fechado! Palpites Revelados',
          message: `O sigilo caiu! Toque para espiar os palpites dos seus rivais na ${round.numero_rodada}ª Rodada do bolão ${campLabel}.`,
          url: '/ranking',
          tag: `market-closed-${round.id}`,
        })
        summary.notificationsSent += res.sent
        summary.events.push(`market_closed:R${round.numero_rodada}:${res.sent}`)
        flags.market_closed = true
        dirty = true
      }

      // 4. Alerta de Cravada para partidas encerradas
      if (['aberta', 'fechada', 'finalizada'].includes(round.status)) {
        const { data: finishedMatches } = await supabase
          .from('partidas')
          .select('id, time_casa, time_fora, gols_casa, gols_fora, is_mandatory, is_extra')
          .eq('rodada_id', round.id)
          .eq('status', 'finalizado')

        if (finishedMatches && finishedMatches.length > 0) {
          const hasFlags = finishedMatches.some((m: any) => m.is_mandatory || m.is_extra)
          const relevantFinished =
            camp.formato === 'copa' || !hasFlags
              ? finishedMatches
              : finishedMatches.filter((m: any) => m.is_mandatory || m.is_extra)

          const pendingCravadaMatches = relevantFinished.filter(
            (m: any) => !flags[`cravada_${m.id}`] && m.gols_casa !== null && m.gols_fora !== null
          )

          if (pendingCravadaMatches.length > 0) {
            const regras = (camp.scoring_systems as any)?.regras || { placar_exato: 3 }
            const exactPoints = Number(regras.placar_exato ?? 3)
            const mult = Number(round.multiplicador || 1)
            const earnedPoints = Math.round(exactPoints * mult * 10) / 10

            const { data: exactBets } = await supabase
              .from('palpites')
              .select('usuario_id, partida_id, gols_casa_bet, gols_fora_bet, pontos')
              .in('partida_id', pendingCravadaMatches.map((m: any) => m.id))
              .in('usuario_id', participantIds)

            for (const match of pendingCravadaMatches) {
              const cravadores = (exactBets || [])
                .filter(
                  (b: any) =>
                    b.partida_id === match.id &&
                    b.gols_casa_bet === match.gols_casa &&
                    b.gols_fora_bet === match.gols_fora
                )
                .map((b: any) => b.usuario_id)

              if (cravadores.length > 0) {
                const res = await sendPushToUsers(supabase, cravadores, 'results_alerts', {
                  title: '🎯 NA MOSCA! Placar Exato!',
                  message: `Você cravou ${match.time_casa} ${match.gols_casa}x${match.gols_fora} ${match.time_fora} na ${round.numero_rodada}ª Rodada (${campLabel}) e somou +${earnedPoints} pontos!`,
                  url: '/ranking',
                  tag: `cravada-${match.id}`,
                })
                summary.notificationsSent += res.sent
                summary.events.push(`cravada:${match.id}:${res.sent}`)
              }

              flags[`cravada_${match.id}`] = true
              dirty = true
            }
          }
        }
      }

      // 5. Fechamento Personalizado da Rodada (ranking geral + desempenho da rodada)
      if (round.status === 'finalizada' && !flags.round_finished) {
        const regras = (camp.scoring_systems as any)?.regras || { placar_exato: 3 }
        const exactScore = Number(regras.placar_exato ?? 3)

        const { data: campRounds } = await supabase
          .from('rodadas')
          .select('id, multiplicador')
          .eq('campeonato_id', camp.id)

        const multMap = new Map<string, number>((campRounds || []).map((r: any) => [r.id, Number(r.multiplicador || 1)]))
        const campRoundIds = Array.from(multMap.keys())

        const [{ data: allBets }, { data: specialBets }] = await Promise.all([
          campRoundIds.length > 0
            ? supabase
                .from('palpites')
                .select('usuario_id, pontos, partidas!inner(status, rodada_id)')
                .eq('partidas.status', 'finalizado')
                .in('partidas.rodada_id', campRoundIds)
                .in('usuario_id', participantIds)
            : Promise.resolve({ data: [] as any[] }),
          supabase
            .from('palpites_especiais')
            .select('usuario_id, pontos')
            .eq('campeonato_id', camp.id)
            .in('usuario_id', participantIds),
        ])

        const statsMap = new Map<
          string,
          {
            nome: string
            totalPontos: number
            totalCravados: number
            totalAcertos: number
            roundPontos: number
            roundCravados: number
            position: number
          }
        >()

        for (const p of participants) {
          statsMap.set(p.id, {
            nome: p.nome,
            totalPontos: 0,
            totalCravados: 0,
            totalAcertos: 0,
            roundPontos: 0,
            roundCravados: 0,
            position: 0,
          })
        }

        for (const b of allBets || []) {
          const st = statsMap.get(b.usuario_id)
          if (!st) continue
          const rId = (b.partidas as any)?.rodada_id
          const mult = multMap.get(rId) || 1
          const pts = Number(b.pontos || 0) * mult
          st.totalPontos += pts
          if (b.pontos === exactScore) {
            st.totalCravados++
          } else if (b.pontos !== 0) {
            st.totalAcertos++
          }

          if (rId === round.id) {
            st.roundPontos += pts
            if (b.pontos === exactScore) {
              st.roundCravados++
            }
          }
        }

        for (const sb of specialBets || []) {
          const st = statsMap.get(sb.usuario_id)
          if (st) st.totalPontos += Number(sb.pontos || 0)
        }

        const ordered = Array.from(statsMap.entries()).sort(([, a], [, b]) => {
          if (b.totalPontos !== a.totalPontos) return b.totalPontos - a.totalPontos
          if (b.totalCravados !== a.totalCravados) return b.totalCravados - a.totalCravados
          if (b.totalAcertos !== a.totalAcertos) return b.totalAcertos - a.totalAcertos
          return a.nome.localeCompare(b.nome)
        })

        ordered.forEach(([, st], idx) => {
          st.position = idx + 1
        })

        const res = await sendPushToUsers(supabase, participantIds, 'results_alerts', (uid) => {
          const st = statsMap.get(uid)
          if (!st) return null
          return {
            title: `🏆 Fim da ${round.numero_rodada}ª Rodada no ${campLabel}!`,
            message: `Você fez ${st.roundPontos} pts na rodada (com ${st.roundCravados} cravada${st.roundCravados === 1 ? '' : 's'}) e agora está em ${st.position}º lugar no Ranking Geral (${st.totalPontos} pts)!`,
            url: '/ranking',
            tag: `round-finished-${round.id}`,
          }
        })
        summary.notificationsSent += res.sent
        summary.events.push(`round_finished:R${round.numero_rodada}:${res.sent}`)
        flags.round_finished = true
        dirty = true
      }

      if (dirty) {
        await supabase
          .from('rodadas')
          .update({ notificacoes_enviadas: flags })
          .eq('id', round.id)
        summary.roundsUpdated++
      }
    }
  }

  return summary
}
