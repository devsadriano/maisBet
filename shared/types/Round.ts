// shared/types/Round.ts
import type { Match } from './Match'

export type RoundStatus =
  | 'aguardando_escolha'
  | 'aberta'
  | 'fechada'
  | 'finalizada'

export interface Round {
  id: string
  campeonato_id: string
  numero_rodada: number
  status: RoundStatus
  organizer_id: string
  organizer_deadline: string   // ISO 8601 — 12h antes do 1º jogo
  betting_deadline: string     // ISO 8601 — 1h antes do 1º jogo
  fase?: string
  multiplicador?: number
  required_extra_games?: number
  calendario_alterado?: boolean
  created_at: string
  organizador?: { nome: string } | null
}

/** Round com partidas embutidas — resultado do join usado em useBets.ts */
export interface RoundWithMatches extends Round {
  partidas: Match[]
}

/** Projeção resumida de rodada — usada em listas e selects (ex: useRoundRanking) */
export type RoundSummary = Pick<Round, 'id' | 'numero_rodada' | 'status'>

