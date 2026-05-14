import { ref } from 'vue'
import { useState, useSupabaseClient } from '#imports'
import type { Database } from '~/types/database.types'
import type { Time } from '~~/shared/types/Time'

export const useTeams = () => {
  const supabase = useSupabaseClient<any>()
  const times = useState<Time[]>('times-list', () => [])
  const loading = ref(false)

  // Helper: extrai os api_team_ids das partidas de um campeonato
  const getTeamIdsFromCampeonato = async (campId: string): Promise<Set<number>> => {
    const teamIds = new Set<number>()
    const { data: rodadas } = await supabase.from('rodadas').select('id').eq('campeonato_id', campId)
    const rodadaIds = rodadas?.map((r: any) => r.id) || []
    if (rodadaIds.length === 0) return teamIds

    const { data: partidas } = await supabase.from('partidas').select('api_team_home_id, api_team_away_id').in('rodada_id', rodadaIds)
    partidas?.forEach((p: any) => {
      if (p.api_team_home_id) teamIds.add(p.api_team_home_id)
      if (p.api_team_away_id) teamIds.add(p.api_team_away_id)
    })
    return teamIds
  }

  const fetchTimes = async (campeonatoId?: string) => {
    loading.value = true
    try {
      let query = supabase.from('times').select('*').order('nome')

      if (campeonatoId) {
        // Tenta buscar times das rodadas/partidas deste campeonato
        const teamIds = await getTeamIdsFromCampeonato(campeonatoId)

        if (teamIds.size > 0) {
          query = query.in('api_team_id', Array.from(teamIds))
        } else {
          // Fallback: busca times de outro campeonato com o mesmo api_competition_code
          const { data: currentCamp } = await supabase
            .from('campeonatos')
            .select('api_competition_code')
            .eq('id', campeonatoId)
            .single()

          if (currentCamp?.api_competition_code) {
            const { data: siblingCamps } = await supabase
              .from('campeonatos')
              .select('id')
              .eq('api_competition_code', currentCamp.api_competition_code)
              .neq('id', campeonatoId)

            for (const sibling of siblingCamps || []) {
              const siblingTeamIds = await getTeamIdsFromCampeonato(sibling.id)
              if (siblingTeamIds.size > 0) {
                query = query.in('api_team_id', Array.from(siblingTeamIds))
                break
              }
            }
          }
        }
      }

      const { data } = await query
      if (data) times.value = data as Time[]
    } catch (e) {
      console.error('Erro ao buscar times do campeonato:', e)
    } finally {
      loading.value = false
    }
  }

  const escolherTime = async (timeId: string, acessoId: string) => {
    // Usa API server-side com service role para garantir que o UPDATE bypassa RLS
    const supabase = useSupabaseClient<any>()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Não autenticado.')

    const response = await fetch('/api/app/choose-team', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ acesso_id: acessoId, time_id: timeId })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.statusMessage || err.message || 'Erro ao salvar time.')
    }
  }

  return { times, loading, fetchTimes, escolherTime }
}
