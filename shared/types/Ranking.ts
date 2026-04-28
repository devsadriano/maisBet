// shared/types/Ranking.ts
import type { Time } from './Time'

export interface RankingEntry {
  usuario_id: string
  nome: string
  time_id?: string
  time_nome?: string
  escudo_url?: string
  total_pontos: number
  total_cravados: number
  total_acertos: number
  total_palpites: number
  position: number
}

export interface RankingTiebreak {
  winner_id: string
  loser_id: string
  reason: 'cravados' | 'acertos' | 'sorteio'
}
