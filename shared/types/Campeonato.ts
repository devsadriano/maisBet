// shared/types/Campeonato.ts

export type CampeonatoStatus = 'rascunho' | 'ativo' | 'finalizado' | 'arquivado'

export interface ScoringSystem {
  id: string
  nome: string
  descricao: string | null
  regras: Record<string, number>  // ex: { placar_exato: 3, vencedor_correto: 1, errou: 0 }
  is_default: boolean
}

export interface Campeonato {
  id: string
  nome: string
  apelido_grupo?: string | null
  api_competition_id?: number
  api_competition_code?: string
  status: 'rascunho' | 'ativo' | 'inativo' | 'finalizado'
  scoring_system_id?: string
  created_at: string
  updated_at: string
  formato?: 'liga' | 'copa'
  
  // Customizações Visuais & Sazonais (Novo)
  logo_url?: string | null
  area_name?: string | null
  area_flag?: string | null
  start_date?: string | null
  end_date?: string | null
  season?: string | null
  max_rodadas?: number | null
  detalhes_premiacao?: string | null

  // Joins (Opcionais pois vêm das queries de join)
  scoring_system?: {
    id: string
    nome: string
    descricao?: string | null
    regras: any
  }
}
