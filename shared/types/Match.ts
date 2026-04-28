// shared/types/Match.ts
export type MatchStatus = 'agendado' | 'finalizado' | 'adiado'

// Status codes da Football-Data.org que mapeiam para cada MatchStatus
export const FOOTBALL_DATA_STATUS_MAP: Record<string, MatchStatus> = {
  SCHEDULED:   'agendado',    // Agendado, não começou
  TIMED:       'agendado',    // Horário definido
  IN_PLAY:     'agendado',    // Em andamento
  PAUSED:      'agendado',    // Intervalo
  SUSPENDED:   'adiado',      // Suspenso
  POSTPONED:   'adiado',      // Adiado
  CANCELLED:   'adiado',      // Cancelado
  AWARDED:     'adiado',      // W.O. / decisão administrativa
  FINISHED:    'finalizado',  // Encerrado
}

export interface Match {
  id: string
  api_match_id: number          // ID inteiro da Football-Data.org
  rodada_id: string
  time_casa: string
  time_fora: string
  api_team_home_id: number | null
  api_team_away_id: number | null
  gols_casa: number | null
  gols_fora: number | null
  status: MatchStatus
  data_partida: string          // ISO 8601
  grupo?: string | null         // Group identifier for World Cup / Cup formats

  is_mandatory: boolean
  is_extra: boolean
  created_at: string
}

// Tipagem da resposta da Football-Data.org para matches
export interface FootballDataMatch {
  id: number
  utcDate: string
  status: string
  matchday: number
  homeTeam: { id: number; name: string; shortName: string; crest: string }
  awayTeam: { id: number; name: string; shortName: string; crest: string }
  score: {
    winner: string | null
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
  }
}

// Resposta wrapper da Football-Data.org para competitions/BSA/matches
export interface FootballDataMatchesResponse {
  filters: Record<string, string>
  resultSet: { count: number; competitions: string; first: string; last: string; played: number }
  competition: { id: number; name: string; code: string }
  matches: FootballDataMatch[]
}

// Tipagem da resposta para teams (usado no seed)
export interface FootballDataTeam {
  id: number
  name: string
  shortName: string
  tla: string
  crest: string
}
