import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auto-cycle-secret',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const logs: string[] = []
  const log = (m: string) => { console.log(m); logs.push(`[${new Date().toISOString()}] ${m}`) }

  try {
    // Auth via secret (optional - only enforced if env var is set)
    const secret = req.headers.get('x-auto-cycle-secret')
    const expected = Deno.env.get('AUTO_CYCLE_SECRET')
    if (expected && secret !== expected) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const url = Deno.env.get('SUPABASE_URL')!
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const fdKey = Deno.env.get('FOOTBALL_DATA_KEY')!
    if (!url || !key || !fdKey) throw new Error('Missing env vars.')
    const sb = createClient(url, key)

    log('--- INICIANDO CICLO DE AUTOMACAO ---')
    const { data: camps } = await sb.from('campeonatos')
      .select('id, api_competition_code, season, max_rodadas, status, formato')
      .eq('status', 'ativo')

    if (!camps || camps.length === 0) {
      log('Nenhum campeonato ativo.')
    } else {
      for (const c of camps) {
        log(`\n>>> ${c.api_competition_code} (${c.season}) <<<`)

        // == ETAPA 1: Sync results de TODAS as rodadas abertas/fechadas ==
        log(`[${c.api_competition_code}] ETAPA 1: Sync resultados...`)
        const { data: rdsSync } = await sb.from('rodadas')
          .select('id, numero_rodada')
          .eq('campeonato_id', c.id)
          .in('status', ['aberta', 'fechada'])

        if (rdsSync && rdsSync.length > 0) {
          for (const rd of rdsSync) {
            const { data: pend } = await sb.from('partidas')
              .select('id').eq('rodada_id', rd.id).eq('status', 'agendado')
            if (!pend || pend.length === 0) {
              log(`[${c.api_competition_code}] Rd ${rd.numero_rodada}: sem pendentes.`)
              continue
            }
            log(`[${c.api_competition_code}] Rd ${rd.numero_rodada}: ${pend.length} pendentes...`)
            const apiRes = await fetch(
              `https://api.football-data.org/v4/competitions/${c.api_competition_code}/matches?matchday=${rd.numero_rodada}&season=${c.season}`,
              { headers: { 'X-Auth-Token': fdKey } }
            )
            if (apiRes.ok) {
              const apiData = await apiRes.json()
              let synced = 0
              for (const m of (apiData.matches || [])) {
                let ls = 'agendado'
                if (m.status === 'FINISHED' || m.status === 'AWARDED') ls = 'finalizado'
                else if (['POSTPONED','CANCELLED','SUSPENDED'].includes(m.status)) ls = 'adiado'
                if (ls !== 'agendado') {
                  const { error } = await sb.from('partidas').update({
                    gols_casa: m.score?.fullTime?.home ?? null,
                    gols_fora: m.score?.fullTime?.away ?? null,
                    status: ls,
                  }).eq('api_match_id', m.id).eq('status', 'agendado')
                  if (!error) synced++
                }
              }
              log(`[${c.api_competition_code}] Rd ${rd.numero_rodada}: ${synced} sincronizadas.`)
            } else {
              log(`[${c.api_competition_code}] ERRO API rd ${rd.numero_rodada}: HTTP ${apiRes.status}`)
            }
          }
        }

        // == ETAPA 2: Auto-Close Rounds ==
        log(`[${c.api_competition_code}] ETAPA 2: Fechando rodadas...`)
        const { data: oRds } = await sb.from('rodadas')
          .select('id, numero_rodada, status')
          .eq('campeonato_id', c.id)
          .in('status', ['aberta', 'fechada'])

        if (oRds) {
          for (const rd of oRds) {
            const { data: pts } = await sb.from('partidas')
              .select('status').eq('rodada_id', rd.id)
              .or('is_mandatory.eq.true,is_extra.eq.true')
            if (pts && pts.length > 0) {
              if (pts.every((p: any) => p.status === 'finalizado' || p.status === 'adiado')) {
                await sb.from('rodadas').update({ status: 'finalizada' }).eq('id', rd.id)
                log(`[${c.api_competition_code}] Rd ${rd.numero_rodada} FINALIZADA!`)
              }
            }
          }
        }

        // == ETAPA 3: Transicoes de status ==
        log(`[${c.api_competition_code}] ETAPA 3: Transicoes...`)
        const now = new Date().toISOString()
        const { data: trRds } = await sb.from('rodadas')
          .select('id, numero_rodada, status, organizer_deadline, betting_deadline, required_extra_games')
          .eq('campeonato_id', c.id)
          .in('status', ['aguardando_escolha', 'aberta'])

        if (trRds) {
          for (const r of trRds) {
            if (r.status === 'aberta' && now >= r.betting_deadline) {
              await sb.from('rodadas').update({ status: 'fechada' }).eq('id', r.id)
              log(`[${c.api_competition_code}] Palpites encerrados rd ${r.numero_rodada}.`)
            }
            if (c.formato !== 'copa' && r.status === 'aguardando_escolha' && now >= r.organizer_deadline) {
              log(`[${c.api_competition_code}] Deadline expirou rd ${r.numero_rodada}. Auto-extras...`)
              const { data: ce } = await sb.from('partidas').select('id').eq('rodada_id', r.id).eq('is_extra', true)
              const falta = Math.max(0, r.required_extra_games - (ce?.length || 0))
              if (falta > 0) {
                const { data: av } = await sb.from('partidas').select('id')
                  .eq('rodada_id', r.id).eq('is_mandatory', false).eq('is_extra', false)
                if (av && av.length > 0) {
                  const sel = av.sort(() => 0.5 - Math.random()).slice(0, falta)
                  for (const x of sel) await sb.from('partidas').update({ is_extra: true }).eq('id', x.id)
                }
              }
              await sb.from('rodadas').update({ status: 'aberta' }).eq('id', r.id)
              log(`[${c.api_competition_code}] Rd ${r.numero_rodada} ABERTA.`)
            }
          }
        }

        // == ETAPA 4: Import Next Round ==
        log(`[${c.api_competition_code}] ETAPA 4: Proxima rodada...`)
        const { data: maxR } = await sb.from('rodadas')
          .select('numero_rodada, status')
          .eq('campeonato_id', c.id)
          .order('numero_rodada', { ascending: false }).limit(1)

        if (maxR && maxR.length > 0 && maxR[0].status === 'finalizada') {
          const next = maxR[0].numero_rodada + 1
          if (next <= c.max_rodadas) {
            log(`[${c.api_competition_code}] Importando rd ${next}...`)
            const res = await fetch(
              `https://api.football-data.org/v4/competitions/${c.api_competition_code}/matches?matchday=${next}&season=${c.season}`,
              { headers: { 'X-Auth-Token': fdKey } }
            )
            if (res.ok) {
              const d = await res.json()
              if (d.matches && d.matches.length > 0) {
                const { count: tp } = await sb.from('usuarios').select('*', { count: 'exact', head: true }).eq('is_admin', false)
                const { data: uwt } = await sb.from('usuarios').select('times(api_team_id)').eq('is_admin', false).not('time_id', 'is', null)
                const utids = new Set(uwt?.map((u: any) => u.times?.api_team_id).filter(Boolean) || [])
                let mc = 0
                const mp = d.matches.map((m: any) => {
                  let im = c.formato === 'copa' || next === c.max_rodadas || utids.has(m.homeTeam.id) || utids.has(m.awayTeam.id)
                  if (im) mc++
                  return { ...m, is_mandatory: im }
                })
                const re = (c.formato === 'copa' || next === c.max_rodadas) ? 0 : Math.max(0, (tp || 0) + 2 - mc)
                const sm = [...mp].sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
                const fmd = new Date(sm[0].utcDate)

                // Copa Deadline: 2h mata-mata (rd > 3), 1h groups
                const isCopaMataMata = c.formato === 'copa' && next > 3
                const deadlineHours = isCopaMataMata ? 2 : 1
                const bd = new Date(fmd.getTime() - deadlineHours * 3600000).toISOString()
                const od = new Date(fmd.getTime() - 43200000).toISOString()
                
                const { data: oid } = await sb.rpc('get_organizer_for_round', { p_numero_rodada: next })
                if (oid) {
                  // Phase/Multiplier logic (static for simplified sync)
                  let fase = 'grupos'
                  let mult = 1.0
                  if (c.formato === 'copa') {
                    if (next === 4) { fase = 'oitavas'; mult = 1.0 }
                    else if (next === 5) { fase = 'quartas'; mult = 1.5 }
                    else if (next === 6) { fase = 'semifinal'; mult = 2.0 }
                    else if (next === 7) { fase = 'final'; mult = 3.0 }
                  }

                  const { data: nr } = await sb.from('rodadas').insert({
                    numero_rodada: next, campeonato_id: c.id,
                    status: (c.formato === 'copa' || next === c.max_rodadas) ? 'aberta' : 'aguardando_escolha',
                    organizer_id: oid, organizer_deadline: od,
                    betting_deadline: bd, required_extra_games: re,
                    fase, multiplicador: mult,
                  }).select('id').single()
                  if (nr) {
                    let ins = 0
                    for (const m of mp) {
                      let ls = 'agendado'
                      if (m.status === 'FINISHED' || m.status === 'AWARDED') ls = 'finalizado'
                      else if (m.status === 'POSTPONED' || m.status === 'CANCELLED') ls = 'adiado'
                      const { error } = await sb.from('partidas').upsert({
                        api_match_id: m.id, rodada_id: nr.id,
                        time_casa: m.homeTeam.shortName || m.homeTeam.name,
                        time_fora: m.awayTeam.shortName || m.awayTeam.name,
                        api_team_home_id: m.homeTeam.id, api_team_away_id: m.awayTeam.id,
                        gols_casa: m.score?.fullTime?.home ?? null,
                        gols_fora: m.score?.fullTime?.away ?? null,
                        status: ls, data_partida: m.utcDate, is_mandatory: m.is_mandatory,
                      }, { onConflict: 'api_match_id' })
                      if (!error) ins++
                    }
                    log(`[${c.api_competition_code}] Rd ${next} CRIADA com ${ins} partidas.`)
                  }
                } else { log(`[${c.api_competition_code}] ERRO: sem organizador rd ${next}.`) }
              } else { log(`[${c.api_competition_code}] API: 0 partidas para rd ${next}.`) }
            } else { log(`[${c.api_competition_code}] ERRO API rd ${next}: HTTP ${res.status}`) }
          } else { log(`[${c.api_competition_code}] Max rodadas atingido.`) }
        } else if (maxR && maxR.length > 0) {
          log(`[${c.api_competition_code}] Rd ${maxR[0].numero_rodada} status '${maxR[0].status}'. Aguardando.`)
        }
      }
    }

    log('--- CICLO CONCLUIDO ---')
    await sb.from('cron_logs').insert({ content: logs.join('\n') })
    return new Response(JSON.stringify({ success: true, logs }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    const em = error.message || 'Erro interno.'
    console.error(error)
    logs.push(`[ERRO CRITICO] ${em}`)
    try {
      const sb2 = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      await sb2.from('cron_logs').insert({ content: logs.join('\n') })
    } catch (_) {}
    return new Response(JSON.stringify({ error: em, logs }), {
      headers: { ...cors, 'Content-Type': 'application/json' }, status: 400,
    })
  }
})
