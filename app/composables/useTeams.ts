import { ref } from 'vue'
import { useState, useSupabaseClient } from '#imports'
import type { Database } from '~/types/database.types'
import type { Time } from '~~/shared/types/Time'

export const useTeams = () => {
  const supabase = useSupabaseClient<any>()
  const times = useState<Time[]>('times-list', () => [])
  const loading = ref(false)

  const fetchTimes = async (campeonatoId?: string) => {
    loading.value = true
    try {
      let query = supabase.from('times').select('*').order('nome')

      if (campeonatoId) {
        const { data: rodadas } = await supabase.from('rodadas').select('id').eq('campeonato_id', campeonatoId)
        const rodadaIds = rodadas?.map((r: any) => r.id) || []
        
        if (rodadaIds.length > 0) {
          const { data: partidas } = await supabase.from('partidas').select('api_team_home_id, api_team_away_id').in('rodada_id', rodadaIds)
          const teamIds = new Set<number>()
          partidas?.forEach((p: any) => {
            if (p.api_team_home_id) teamIds.add(p.api_team_home_id)
            if (p.api_team_away_id) teamIds.add(p.api_team_away_id)
          })

          if (teamIds.size > 0) {
            query = query.in('api_team_id', Array.from(teamIds))
          } else {
            times.value = []
            return
          }
        } else {
          times.value = []
          return
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
