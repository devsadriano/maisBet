// app/composables/useRoundRanking.ts
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { useCampeonato } from '~/composables/useCampeonato'
import type { RankingEntry } from '~/../shared/types/Ranking'
import type { RoundSummary } from '~~/shared/types/Round'

export interface MatchPoint {
  partida_id: string
  usuario_id: string
  pontos: number
  gols_casa_bet?: number
  gols_fora_bet?: number
}

export interface RoundMatch {
  id: string
  time_casa: string
  time_fora: string
  gols_casa?: number | null
  gols_fora?: number | null
  status: string
  api_team_home_id?: number | null
  api_team_away_id?: number | null
}

export const useRoundRanking = () => {
  const supabase = useSupabaseClient()
  const { campeonatoAtivo } = useCampeonato()
  
  const rounds = useState<RoundSummary[]>('round-ranking-rounds', () => [])
  const selectedRoundId = useState<string | null>('round-ranking-selected-id', () => null)
  const matches = useState<RoundMatch[]>('round-ranking-matches', () => [])
  const matrix = useState<Record<string, Record<string, any>>>('round-ranking-matrix', () => ({}))
  const roundRanking = useState<RankingEntry[]>('round-ranking-results', () => [])
  const loading = useState<boolean>('round-ranking-loading', () => false)
  const cachedRoundId = useState<string | null>('round-ranking-cached-id', () => null)

  const fetchRounds = async () => {
    if (!campeonatoAtivo.value) {
      rounds.value = []
      selectedRoundId.value = null
      return
    }

    const { data } = await supabase
      .from('rodadas')
      .select('id, numero_rodada, status, multiplicador')
      .eq('campeonato_id', campeonatoAtivo.value.id)
      .order('numero_rodada', { ascending: false })
      
    rounds.value = (data as unknown as RoundSummary[]) || []
    if (rounds.value.length > 0 && !selectedRoundId.value) {
      selectedRoundId.value = rounds.value[0]?.id ?? null
    }
  }

  const fetchRoundData = async () => {
    if (!selectedRoundId.value) return
    
    if (cachedRoundId.value !== selectedRoundId.value) {
      matches.value = []
      matrix.value = {}
      roundRanking.value = []
      cachedRoundId.value = selectedRoundId.value
    }
    
    loading.value = matches.value.length === 0
    try {
      // 1. Fetch matches for the round
      const { data: matchesData } = await supabase
        .from('partidas')
        .select('*')
        .eq('rodada_id', selectedRoundId.value)
        .or('is_mandatory.eq.true,is_extra.eq.true')
        .order('data_partida', { ascending: true })
      
      matches.value = (matchesData as unknown as RoundMatch[]) || []
      const matchIds = matches.value.map(m => m.id)

      // 2. Fetch all palpites for these matches
      const { data: palpitesData } = await supabase
        .from('palpites')
        .select('usuario_id, partida_id, pontos, gols_casa_bet, gols_fora_bet')
        .in('partida_id', matchIds)

      // 3. Build Matrix
      const newMatrix: Record<string, Record<string, any>> = {}
      ;(palpitesData as MatchPoint[] | null)?.forEach(p => {
        if (!newMatrix[p.usuario_id]) newMatrix[p.usuario_id] = {}
        const row = newMatrix[p.usuario_id]
        if (row) {
          row[p.partida_id] = {
            pontos: p.pontos,
            palpite_casa: p.gols_casa_bet,
            palpite_fora: p.gols_fora_bet
          }
        }
      })
      matrix.value = newMatrix

      // 4. Calculate round ranking (points for this round only)
      const { data: users } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .eq('is_admin', false)
        
      // @ts-ignore
      const { data: acessosData } = await supabase
        .from('campeonato_acessos')
        .select('email, time_id, times(nome, escudo_url)')
        .eq('campeonato_id', campeonatoAtivo.value?.id || '')
      
      const regras = (campeonatoAtivo.value as any)?.scoring_systems?.regras || { placar_exato: 3 }
      const exactScore = regras.placar_exato !== undefined ? regras.placar_exato : 3

      const currentRound = rounds.value.find(r => r.id === selectedRoundId.value)
      const multiplier = Number((currentRound as any)?.multiplicador || 1)

      const authorizedUsers = (users || []).filter(u => 
        (acessosData as any[] || []).some(a => a.email.toLowerCase() === u.email.toLowerCase())
      )

      const ranking: RankingEntry[] = authorizedUsers.map((u: any) => {
        const userPoints = newMatrix[u.id] || {}
        let total = 0
        let cravados = 0
        let acertos = 0
        Object.values(userPoints).forEach((entry: any) => {
          const pts = entry?.pontos || 0
          total += (pts * multiplier)
          if (pts === exactScore) cravados++
          else if (pts > 0) acertos++
        })

        const acessoUser = (acessosData as any[] || []).find(a => a.email === u.email)

        return {
          usuario_id: u.id,
          nome: u.nome,
          time_id: acessoUser?.time_id || null,
          time_nome: acessoUser?.times?.nome || null,
          escudo_url: acessoUser?.times?.escudo_url || null,
          total_pontos: total,
          total_cravados: cravados,
          total_acertos: acertos,
          total_palpites: Object.keys(userPoints).length,
          position: 0
        }
      })

      roundRanking.value = ranking.sort((a, b) => b.total_pontos - a.total_pontos || b.total_cravados - a.total_cravados)
        .map((r, i) => ({ ...r, position: i + 1 }))

    } catch (err) {
      console.error('Erro ao buscar dados da rodada:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    rounds,
    selectedRoundId,
    matches,
    matrix,
    roundRanking,
    loading,
    fetchRounds,
    fetchRoundData
  }
}
