import { ref, computed } from 'vue'
import { useState } from '#app'
import { useSupabaseClient } from '#imports'
import type { Campeonato } from '~~/shared/types/Campeonato'
import { useAuth } from './useAuth'

export const useCampeonato = () => {
  const supabase = useSupabaseClient()
  const { user, isAdmin } = useAuth()
  
  // Estado global (`useState` evita perder o estado ao navegar entre router pages no Nuxt)
  const campeonatos = useState<Campeonato[]>('lista-campeonatos', () => [])
  const campeonatoAtivo = useState<Campeonato | null>('campeonato-ativo', () => null)
  const currentAcesso = useState<any | null>('campeonato-acesso-atual', () => null)
  
  const loading = ref(false)
  
  // Regras de pontuação fallback caso não encontre
  const defaultScoring = { placar_exato: 3, vencedor_correto: 1, errou: 0 }
  
  const scoringSystem = computed(() => {
    if (!campeonatoAtivo.value?.scoring_system) {
      return defaultScoring
    }
    return campeonatoAtivo.value.scoring_system.regras
  })

  const fetchCampeonatos = async (force = false) => {
    // Evita refetch se já temos dados para a UI ficar mais rápida
    if (campeonatos.value.length > 0 && !force) return

    loading.value = true
    try {
      // Variável para guardar os acessos do jogador (preenchida apenas no branch não-admin)
      let acessosDoJogador: any[] | null = null;
      let query;

      if (isAdmin.value) {
          // Administradores enxergam todos os bolões ativos normalmente
          query = supabase
            .from('campeonatos')
            .select(`
              *,
              scoring_system:scoring_systems(*)
            `)
            .eq('status', 'ativo')
            .order('created_at', { ascending: false })
      } else {
          // Jogadores só enxergam bolões onde receberam acesso explícito prévio
          const userEmail = user.value?.email || '';
          
          if (!userEmail) {
              campeonatos.value = [];
              loading.value = false;
              return;
          }

          // 1. O usuário consulta QUAIS campeonatos ele tem acesso
          // @ts-ignore
          const { data: acessos, error: acessosErr } = await supabase
             .from('campeonato_acessos')
             .select('id, campeonato_id, time_id, times(id, nome, escudo_url)')
             .eq('email', userEmail);
             
          if (acessosErr) throw acessosErr;
          
          acessosDoJogador = acessos;
          
          if (!acessos || acessos.length === 0) {
             query = supabase.from('campeonatos').select('*').eq('id', '00000000-0000-0000-0000-000000000000'); // Dummy query to return empty
          } else {
             // @ts-ignore
             const ids = acessos.map(a => a.campeonato_id).filter((id): id is string => id !== null);
             query = supabase
               .from('campeonatos')
               .select(`
                 *,
                 scoring_system:scoring_systems(*)
               `)
               .eq('status', 'ativo')
               .in('id', ids)
               .order('created_at', { ascending: false });
          }
      }

      const { data, error } = await query

      if (error) throw error

      if (data) {
        // Para jogadores, embutir o acesso de cada campeonato de forma síncrona
        if (acessosDoJogador && acessosDoJogador.length > 0) {
           campeonatos.value = data.map(camp => {
              // @ts-ignore
              const acc = acessosDoJogador!.find(a => a.campeonato_id === camp.id);
              return { ...camp, user_acesso: acc || null }
           }) as any[];
        } else {
           campeonatos.value = data as any[];
        }
        
        let savedId: string | null = null
        if (process.client) {
            savedId = localStorage.getItem('bolao_ativo_id')
        }
        
        if (campeonatos.value.length > 0) {
          if (savedId) {
             const persistido = campeonatos.value.find(c => c.id === savedId)
             if (persistido) {
                campeonatoAtivo.value = persistido
                // @ts-ignore
                if (persistido.user_acesso) {
                   // @ts-ignore
                   currentAcesso.value = persistido.user_acesso
                }
             } else {
                campeonatoAtivo.value = null
             }
          } else {
             campeonatoAtivo.value = null
          }
        } else {
          campeonatoAtivo.value = null
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar campeonatos ativos:', err.message)
    } finally {
      loading.value = false
    }
  }

  const selecionarCampeonato = (id: string) => {
    const target = campeonatos.value.find(c => c.id === id)
    if (target) {
      campeonatoAtivo.value = target
      // @ts-ignore
      if (target.user_acesso) {
         // @ts-ignore
         currentAcesso.value = target.user_acesso;
      }
      if (process.client) {
         localStorage.setItem('bolao_ativo_id', id)
      }
    }
  }

  const clearCache = () => {
    campeonatos.value = []
    campeonatoAtivo.value = null
    currentAcesso.value = null
    if (process.client) {
       localStorage.removeItem('bolao_ativo_id')
    }
  }

  return {
    campeonatos,
    campeonatoAtivo,
    currentAcesso,
    scoringSystem,
    loading,
    fetchCampeonatos,
    selecionarCampeonato,
    clearCache
  }
}
