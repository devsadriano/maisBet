// shared/types/Bet.ts
export interface Bet {
  id: string
  usuario_id: string
  partida_id: string
  gols_casa_bet: number
  gols_fora_bet: number
  pontos: number
  created_at: string
}

// Palpite com dados da partida (para exibição)
export interface BetWithMatch extends Bet {
  partida: {
    time_casa: string
    time_fora: string
    gols_casa: number | null
    gols_fora: number | null
    status: string
    data_partida: string
  }
}

// Para a tabela cruzada do Audit
export interface AuditRow {
  usuario: {
    id: string
    nome: string
  }
  palpites: Record<string, { // chave = partida_id
    gols_casa_bet: number
    gols_fora_bet: number
    pontos: number
  }>
  total_pontos: number
}
