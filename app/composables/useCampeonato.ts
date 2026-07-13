import { ref, computed, watch } from 'vue'
import { useState } from '#app'
import { useSupabaseClient } from '#imports'
import type { Campeonato } from '~~/shared/types/Campeonato'
import { useAuth } from './useAuth'

export const useCampeonato = () => {
  const supabase = useSupabaseClient()
  const { user, isAdmin, waitForProfile } = useAuth()
  
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

  // Helper centralizado para detectar se o campeonato ativo é formato Copa
  const isCopaAtivo = computed(() => {
    if (!campeonatoAtivo.value) return false
    
    // Campo formato explícito
    if (campeonatoAtivo.value.formato === 'copa') return true
    if (campeonatoAtivo.value.formato === 'liga') return false

    // Fallbacks (API code ou palavras-chave no nome)
    const COPA_CODES = ['WC', 'EC', 'CAF', 'AFC', 'CONC', 'OFC', 'CAN', 'CLI', 'CWC']
    const COPA_NAME_KEYWORDS = ['world cup', 'copa do mundo', 'copa mundial', 'copa america', 'eurocopa', 'nations cup', 'african cup', 'gold cup', 'continental']

    const code = (campeonatoAtivo.value.api_competition_code || '').toUpperCase()
    if (code && COPA_CODES.some(c => code === c || code.startsWith(c))) return true

    const nome = (campeonatoAtivo.value.nome || '').toLowerCase()
    if (COPA_NAME_KEYWORDS.some(k => nome.includes(k))) return true

    return false
  })

  const fetchCampeonatos = async (force = false) => {
    // Evita refetch se já temos dados para a UI ficar mais rápida
    if (campeonatos.value.length > 0 && !force) return

    // CRITICAL FIX: Garante que o perfil (is_admin) está carregado ANTES de decidir
    // qual query usar. Sem isso, fetchCampeonatos pode rodar com isAdmin=false para admins,
    // carregando os dados no branch de usuário comum (race condition no mount do layout).
    await waitForProfile()

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
          // Jogadores veem TODOS os bolões ativos, mas com metadados de acesso
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
          
          // 2. Busca TODOS os campeonatos ativos (não apenas os com acesso)
          query = supabase
            .from('campeonatos')
            .select(`
              *,
              scoring_system:scoring_systems(*)
            `)
            .eq('status', 'ativo')
            .order('created_at', { ascending: false });
      }

      const { data, error } = await query

      if (error) throw error

      if (data) {
        // Para jogadores, embutir o acesso de cada campeonato (null se sem acesso)
        if (!isAdmin.value) {
           campeonatos.value = data.map(camp => {
              // @ts-ignore
              const acc = acessosDoJogador?.find(a => a.campeonato_id === camp.id) || null;
              return { ...camp, user_acesso: acc }
           }) as any[];
        } else {
           campeonatos.value = data as any[];
        }
        
        let savedId: string | null = null
        if (process.client) {
            savedId = localStorage.getItem('bolao_ativo_id')
        }
        
        if (campeonatos.value.length > 0) {
          let target = savedId ? campeonatos.value.find(c => c.id === savedId) : null
          
          // CRITICAL FIX: Removida a guarda process.client — o SSR também precisa selecionar
          // um campeonato padrão para que campeonatoAtivo seja não-nulo no payload de hidratação.
          // Sem isso, campeonatoAtivo chegava como null no cliente, causando flash do lobby
          // com todos os bolões exibindo "SEM ACESSO" antes da re-hidratação do cliente.
          if (!target) {
            if (isAdmin.value) {
              target = campeonatos.value[0]
            } else {
              // @ts-ignore
              target = campeonatos.value.find(c => c.user_acesso) || campeonatos.value[0]
            }
          }

          if (target) {
            campeonatoAtivo.value = target
            // @ts-ignore
            if (target.user_acesso) {
               // @ts-ignore
               currentAcesso.value = target.user_acesso
            }
            if (process.client) {
               localStorage.setItem('bolao_ativo_id', target.id)
            }
          } else {
            campeonatoAtivo.value = null
            currentAcesso.value = null
          }
        } else {
          campeonatoAtivo.value = null
          currentAcesso.value = null
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar campeonatos ativos:', err.message)
    } finally {
      loading.value = false
    }
  }

  const selecionarCampeonato = (id: string) => {
    if (!id) {
      campeonatoAtivo.value = null
      currentAcesso.value = null
      if (process.client) {
         localStorage.removeItem('bolao_ativo_id')
      }
      return
    }

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

  // Restaura o bolão ativo do localStorage no cliente caso tenha sido hidratado como null pelo SSR.
  // CRITICAL FIX: O watcher agora é async e aguarda o perfil (waitForProfile) antes de tomar
  // decisões baseadas em isAdmin, prevenindo race conditions durante a hidratação do cliente.
  if (process.client) {
    watch(campeonatos, async (newCamps) => {
      if (newCamps.length > 0 && !campeonatoAtivo.value) {
        // Aguarda o perfil carregar antes de tomar decisões baseadas em isAdmin,
        // prevenindo race conditions durante a hidratação do cliente.
        await waitForProfile()

        const savedId = localStorage.getItem('bolao_ativo_id')
        let target = savedId ? newCamps.find(c => c.id === savedId) : null
        
        // Se não encontrou pelo ID salvo, tenta selecionar o primeiro com acesso ativo (para jogadores) ou o primeiro da lista (para admin)
        if (!target) {
          if (isAdmin.value) {
            target = newCamps[0]
          } else {
            // @ts-ignore
            target = newCamps.find(c => c.user_acesso) || newCamps[0]
          }
        }
        
        if (target) {
          campeonatoAtivo.value = target
          // @ts-ignore
          if (target.user_acesso) {
            // @ts-ignore
            currentAcesso.value = target.user_acesso
          }
          localStorage.setItem('bolao_ativo_id', target.id)
        }
      }
    }, { immediate: true })
  }

  return {
    campeonatos,
    campeonatoAtivo,
    currentAcesso,
    scoringSystem,
    isCopaAtivo,
    loading,
    fetchCampeonatos,
    selecionarCampeonato,
    clearCache
  }
}
