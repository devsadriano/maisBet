export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      campeonato_acessos: {
        Row: {
          campeonato_id: string | null
          created_at: string | null
          email: string
          id: string
          time_id: string | null
        }
        Insert: {
          campeonato_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          time_id?: string | null
        }
        Update: {
          campeonato_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          time_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campeonato_acessos_campeonato_id_fkey"
            columns: ["campeonato_id"]
            isOneToOne: false
            referencedRelation: "campeonatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campeonato_acessos_time_id_fkey"
            columns: ["time_id"]
            isOneToOne: false
            referencedRelation: "times"
            referencedColumns: ["id"]
          },
        ]
      }
      campeonatos: {
        Row: {
          api_competition_code: string
          apelido_grupo: string | null
          area_flag: string | null
          area_name: string | null
          created_at: string | null
          created_by: string | null
          detalhes_premiacao: string | null
          end_date: string | null
          formato: string | null
          id: string
          logo_url: string | null
          max_rodadas: number | null
          nome: string
          scoring_system_id: string | null
          season: number
          start_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          api_competition_code: string
          apelido_grupo?: string | null
          area_flag?: string | null
          area_name?: string | null
          created_at?: string | null
          created_by?: string | null
          detalhes_premiacao?: string | null
          end_date?: string | null
          formato?: string | null
          id?: string
          logo_url?: string | null
          max_rodadas?: number | null
          nome: string
          scoring_system_id?: string | null
          season: number
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          api_competition_code?: string
          apelido_grupo?: string | null
          area_flag?: string | null
          area_name?: string | null
          created_at?: string | null
          created_by?: string | null
          detalhes_premiacao?: string | null
          end_date?: string | null
          formato?: string | null
          id?: string
          logo_url?: string | null
          max_rodadas?: number | null
          nome?: string
          scoring_system_id?: string | null
          season?: number
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campeonatos_scoring_system_id_fkey"
            columns: ["scoring_system_id"]
            isOneToOne: false
            referencedRelation: "scoring_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_logs: {
        Row: {
          content: string
          created_at: string
          id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      email_autorizados: {
        Row: {
          autorizado_em: string
          email: string
          id: string
          nome_ref: string | null
        }
        Insert: {
          autorizado_em?: string
          email: string
          id?: string
          nome_ref?: string | null
        }
        Update: {
          autorizado_em?: string
          email?: string
          id?: string
          nome_ref?: string | null
        }
        Relationships: []
      }
      palpites: {
        Row: {
          created_at: string
          gols_casa_bet: number
          gols_fora_bet: number
          id: string
          partida_id: string
          pontos: number
          usuario_id: string
        }
        Insert: {
          created_at?: string
          gols_casa_bet: number
          gols_fora_bet: number
          id?: string
          partida_id: string
          pontos?: number
          usuario_id: string
        }
        Update: {
          created_at?: string
          gols_casa_bet?: number
          gols_fora_bet?: number
          id?: string
          partida_id?: string
          pontos?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "palpites_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "palpites_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      palpites_especiais: {
        Row: {
          api_team_id: number | null
          campeonato_id: string
          created_at: string | null
          id: string
          pontos: number | null
          tipo: string
          usuario_id: string
          valor: string
        }
        Insert: {
          api_team_id?: number | null
          campeonato_id: string
          created_at?: string | null
          id?: string
          pontos?: number | null
          tipo: string
          usuario_id: string
          valor: string
        }
        Update: {
          api_team_id?: number | null
          campeonato_id?: string
          created_at?: string | null
          id?: string
          pontos?: number | null
          tipo?: string
          usuario_id?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "palpites_especiais_campeonato_id_fkey"
            columns: ["campeonato_id"]
            isOneToOne: false
            referencedRelation: "campeonatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "palpites_especiais_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      partidas: {
        Row: {
          api_match_id: number
          api_team_away_id: number | null
          api_team_home_id: number | null
          created_at: string
          data_partida: string
          gols_casa: number | null
          gols_fora: number | null
          grupo: string | null
          id: string
          is_extra: boolean
          is_mandatory: boolean
          rodada_id: string
          status: string
          time_casa: string
          time_fora: string
        }
        Insert: {
          api_match_id: number
          api_team_away_id?: number | null
          api_team_home_id?: number | null
          created_at?: string
          data_partida: string
          gols_casa?: number | null
          gols_fora?: number | null
          grupo?: string | null
          id?: string
          is_extra?: boolean
          is_mandatory?: boolean
          rodada_id: string
          status?: string
          time_casa: string
          time_fora: string
        }
        Update: {
          api_match_id?: number
          api_team_away_id?: number | null
          api_team_home_id?: number | null
          created_at?: string
          data_partida?: string
          gols_casa?: number | null
          gols_fora?: number | null
          grupo?: string | null
          id?: string
          is_extra?: boolean
          is_mandatory?: boolean
          rodada_id?: string
          status?: string
          time_casa?: string
          time_fora?: string
        }
        Relationships: [
          {
            foreignKeyName: "partidas_rodada_id_fkey"
            columns: ["rodada_id"]
            isOneToOne: false
            referencedRelation: "rodadas"
            referencedColumns: ["id"]
          },
        ]
      }
      rodadas: {
        Row: {
          betting_deadline: string | null
          campeonato_id: string
          created_at: string
          fase: string | null
          id: string
          multiplicador: number | null
          numero_rodada: number
          organizer_deadline: string | null
          organizer_id: string
          required_extra_games: number
          status: string
        }
        Insert: {
          betting_deadline?: string | null
          campeonato_id: string
          created_at?: string
          fase?: string | null
          id?: string
          multiplicador?: number | null
          numero_rodada: number
          organizer_deadline?: string | null
          organizer_id: string
          required_extra_games?: number
          status?: string
        }
        Update: {
          betting_deadline?: string | null
          campeonato_id?: string
          created_at?: string
          fase?: string | null
          id?: string
          multiplicador?: number | null
          numero_rodada?: number
          organizer_deadline?: string | null
          organizer_id?: string
          required_extra_games?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rodadas_campeonato_id_fkey"
            columns: ["campeonato_id"]
            isOneToOne: false
            referencedRelation: "campeonatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rodadas_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_systems: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          is_default: boolean | null
          nome: string
          regras: Json
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_default?: boolean | null
          nome: string
          regras?: Json
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_default?: boolean | null
          nome?: string
          regras?: Json
        }
        Relationships: []
      }
      times: {
        Row: {
          api_team_id: number
          created_at: string
          escudo_url: string | null
          id: string
          nome: string
        }
        Insert: {
          api_team_id: number
          created_at?: string
          escudo_url?: string | null
          id?: string
          nome: string
        }
        Update: {
          api_team_id?: number
          created_at?: string
          escudo_url?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          cidade: string | null
          estado: string | null
          created_at: string
          email: string
          id: string
          is_admin: boolean
          nome: string
          status: string
          telefone: string | null
        }
        Insert: {
          cidade?: string | null
          estado?: string | null
          created_at?: string
          email: string
          id: string
          is_admin?: boolean
          nome: string
          status?: string
          telefone?: string | null
        }
        Update: {
          cidade?: string | null
          estado?: string | null
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean
          nome?: string
          status?: string
          telefone?: string | null
        }
        Relationships: []
      }
      solicitacoes: {
        Row: {
          admin_id: string | null
          campeonato_id: string | null
          cidade: string | null
          estado: string | null
          created_at: string
          email: string
          id: string
          mensagem: string | null
          motivo_rejeicao: string | null
          nome: string | null
          resolved_at: string | null
          status: string
          telefone: string | null
          tipo: string
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          campeonato_id?: string | null
          cidade?: string | null
          estado?: string | null
          created_at?: string
          email: string
          id?: string
          mensagem?: string | null
          motivo_rejeicao?: string | null
          nome?: string | null
          resolved_at?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          campeonato_id?: string | null
          cidade?: string | null
          estado?: string | null
          created_at?: string
          email?: string
          id?: string
          mensagem?: string | null
          motivo_rejeicao?: string | null
          nome?: string | null
          resolved_at?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_campeonato_id_fkey"
            columns: ["campeonato_id"]
            isOneToOne: false
            referencedRelation: "campeonatos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_organizer_for_round: {
        Args: { p_numero_rodada: number }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
