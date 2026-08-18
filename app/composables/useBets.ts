import { ref, computed, onUnmounted } from 'vue'
import { useSupabaseClient } from '#imports'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { Match } from '~~/shared/types/Match'
import type { RoundWithMatches } from '~~/shared/types/Round'
import { useCampeonato } from './useCampeonato'

// BetEntry é um DTO de estado de UI (não é uma entidade de domínio),
// por isso permanece local neste composable.
interface BetEntry {
    id: string | null
    gols_casa_bet: number
    gols_fora_bet: number
}

export const useBets = () => {
    const supabase = useSupabaseClient<Database>()
    const { profile } = useAuth()
    const { campeonatoAtivo, isCopaAtivo } = useCampeonato()
    
    const rodada = useState<RoundWithMatches | null>('bets-rodada', () => null)
    const loading = useState<boolean>('bets-loading', () => true)
    const salvando = useState<boolean>('bets-salvando', () => false)
    const locked = useState<boolean>('bets-locked', () => false)
    const bets = useState<Record<string, BetEntry>>('bets-data', () => ({}))
    const escudosMap = useState<Record<number, string>>('bets-escudos', () => ({}))
    const timeRemaining = useState<string>('bets-time-remaining', () => '')
    const cachedCampId = useState<string>('bets-cached-camp-id', () => '')
    // Estado para visualização da última rodada (modo leitura, palpites encerrados)
    const lastClosedRound = useState<RoundWithMatches | null>('bets-last-closed-round', () => null)
    const lastRoundBets = useState<Record<string, BetEntry>>('bets-last-round-bets', () => ({}))
    let timer: any = null

    const fetchInitialData = async () => {
        if (!campeonatoAtivo.value) {
            rodada.value = null
            bets.value = {}
            cachedCampId.value = ''
            loading.value = false
            return
        }

        // Se mudou de campeonato, limpa o cache anterior
        if (cachedCampId.value !== campeonatoAtivo.value.id) {
            rodada.value = null
            bets.value = {}
            cachedCampId.value = campeonatoAtivo.value.id
        }

        loading.value = true
        locked.value = false
        if (timer) { clearInterval(timer); timer = null }
        
        // 1. Fetch Shields
        const { data: times } = await supabase.from('times').select('api_team_id, escudo_url')
        if (times) times.forEach((t: any) => escudosMap.value[t.api_team_id] = t.escudo_url)

        // 2. Fetch Active Round
        const { data: r } = await supabase
            .from('rodadas')
            .select('id, numero_rodada, status, betting_deadline, organizer_id, organizer_deadline, required_extra_games, fase, multiplicador, calendario_alterado, partidas(*), organizador:usuarios!organizer_id(nome)')
            .in('status', ['aberta', 'aguardando_escolha'])
            .eq('campeonato_id', campeonatoAtivo.value.id)
            .order('numero_rodada', { ascending: true })
            .limit(1)
            .maybeSingle()

        if (r) {
            rodada.value = r as unknown as RoundWithMatches

            // Show mandatory + extra games. If none are flagged, show ALL games (e.g. World Cup format)
            const isCopa = isCopaAtivo.value
            const hasFlags = rodada.value.partidas.some((p: Match) => p.is_mandatory || p.is_extra)
            const validMatches = (hasFlags && !isCopa)
              ? rodada.value.partidas.filter((p: Match) => p.is_mandatory || p.is_extra)
              : rodada.value.partidas
            validMatches.forEach((p: Match) => {
                bets.value[p.id] = { id: null, gols_casa_bet: 0, gols_fora_bet: 0 }
            })

            // Fetch existing user bets
            const currentProfile = profile.value
            if (currentProfile) {
                const { data: userBets } = await supabase
                    .from('palpites')
                    .select('id, partida_id, gols_casa_bet, gols_fora_bet')
                    .eq('usuario_id', currentProfile.id)
                    .in('partida_id', validMatches.map((p: Match) => p.id))
                
                if (userBets) {
                    userBets.forEach((b: any) => {
                        bets.value[b.partida_id] = {
                            id: b.id,
                            gols_casa_bet: b.gols_casa_bet,
                            gols_fora_bet: b.gols_fora_bet
                        }
                    })
                }
            }

            startTimer()
        } else {
            // Nenhuma rodada aberta: busca última rodada para exibição em leitura
            await fetchLastRoundBets()
        }
        loading.value = false
    }

    const fetchLastRoundBets = async () => {
        if (!campeonatoAtivo.value || !profile.value) return

        const { data: lr } = await supabase
            .from('rodadas')
            .select('id, numero_rodada, status, betting_deadline, organizer_id, organizer_deadline, required_extra_games, fase, multiplicador, calendario_alterado, partidas(*), organizador:usuarios!organizer_id(nome)')
            .eq('campeonato_id', campeonatoAtivo.value.id)
            .in('status', ['fechada', 'finalizada'])
            .order('numero_rodada', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (!lr) return

        const isCopa = isCopaAtivo.value
        const roundData = lr as unknown as RoundWithMatches
        const hasFlags = roundData.partidas.some((p: Match) => p.is_mandatory || p.is_extra)
        const validMatches = (hasFlags && !isCopa)
          ? roundData.partidas.filter((p: Match) => p.is_mandatory || p.is_extra)
          : roundData.partidas

        // Busca somente os palpites que o usuário realmente fez
        const { data: userBets } = await supabase
            .from('palpites')
            .select('id, partida_id, gols_casa_bet, gols_fora_bet')
            .eq('usuario_id', profile.value.id)
            .in('partida_id', validMatches.map((p: Match) => p.id))

        if (!userBets || userBets.length === 0) return

        // Apenas partidas que o usuário palpitou
        const bettedIds = new Set(userBets.map((b: any) => b.partida_id))
        const betsInit: Record<string, BetEntry> = {}
        userBets.forEach((b: any) => {
            betsInit[b.partida_id] = {
                id: b.id,
                gols_casa_bet: b.gols_casa_bet,
                gols_fora_bet: b.gols_fora_bet
            }
        })

        // Filtra partidas da rodada para mostrar só as que o usuário palpitou
        lastClosedRound.value = {
            ...roundData,
            partidas: validMatches.filter((p: Match) => bettedIds.has(p.id))
        }
        lastRoundBets.value = betsInit
    }

    const startTimer = () => {
        if (timer) { clearInterval(timer); timer = null }
        const update = () => {
            const currentRound = rodada.value
            if (!currentRound?.betting_deadline) return
            
            const diff = new Date(currentRound.betting_deadline).getTime() - new Date().getTime()
            if (diff <= 0) {
                locked.value = true
                timeRemaining.value = 'Encerrado'
                if (timer) clearInterval(timer)
                return
            }
            const totalSeconds = Math.floor(diff / 1000)
            const d = Math.floor(totalSeconds / 86400)
            const h = Math.floor((totalSeconds % 86400) / 3600)
            const m = Math.floor((totalSeconds % 3600) / 60)
            const s = totalSeconds % 60
            timeRemaining.value = d > 0
              ? `${d}d ${h}h ${m}m ${s}s`
              : `${h}h ${m}m ${s}s`
        }
        update()
        timer = setInterval(update, 1000)
    }

    const saveAllBets = async () => {
        const currentProfile = profile.value
        if (locked.value || !currentProfile) return { success: false, message: 'Não é possível salvar' }
        
        salvando.value = true
        // Tipagem forte do payload garante proteção contra mudanças de schema.
        // O cast na chamada upsert abaixo é restrito ao bug de inferência do SupabaseClient.
        type PalpiteInsert = Database['public']['Tables']['palpites']['Insert']
        
        const payloads: PalpiteInsert[] = Object.keys(bets.value)
            .filter(pId => {
                const partida = rodada.value?.partidas.find((p: any) => p.id === pId)
                if (!partida) return false
                // Apenas permite salvar se a partida estiver no futuro (não iniciada)
                return new Date(partida.data_partida).getTime() > new Date().getTime()
            })
            .map(pId => {
                const entry = bets.value[pId]
                return {
                    ...(entry?.id ? { id: entry.id } : {}),
                    usuario_id: currentProfile.id,
                    partida_id: pId,
                    gols_casa_bet: entry?.gols_casa_bet || 0,
                    gols_fora_bet: entry?.gols_fora_bet || 0
                }
            })

        if (payloads.length === 0) {
            salvando.value = false
            return { success: true }
        }

        try {
            const { error } = await (supabase.from('palpites') as any)
                .upsert(payloads, { onConflict: 'usuario_id, partida_id' })
            
            if (error) throw new Error(error.message)
            
            const { data: newBets } = await supabase
                .from('palpites')
                .select('id, partida_id')
                .eq('usuario_id', currentProfile.id)
                .in('partida_id', Object.keys(bets.value))
                
            if (newBets) {
                newBets.forEach((b: any) => {
                    const entry = bets.value[b.partida_id]
                    if (entry) {
                        entry.id = b.id
                    }
                })
            }
            
            return { success: true }
        } catch (e: any) {
            return { success: false, message: e.message }
        } finally {
            salvando.value = false
        }
    }

    onUnmounted(() => { if (timer) clearInterval(timer) })

    const sortedMatches = computed(() => {
        const currentRound = rodada.value
        if (!currentRound?.partidas) return []
        const isCopa = isCopaAtivo.value
        const hasFlags = currentRound.partidas.some(p => p.is_mandatory || p.is_extra)
        const filtered = (hasFlags && !isCopa)
          ? currentRound.partidas.filter(p => p.is_mandatory || p.is_extra)
          : currentRound.partidas
        return [...filtered]
            .sort((a, b) => new Date(a.data_partida).getTime() - new Date(b.data_partida).getTime())
    })

    return {
        rodada,
        loading,
        salvando,
        locked,
        bets,
        escudosMap,
        timeRemaining,
        fetchInitialData,
        saveAllBets,
        sortedMatches,
        lastClosedRound,
        lastRoundBets
    }
}
