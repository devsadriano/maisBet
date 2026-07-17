// app/composables/useRanking.ts
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import type { RankingEntry } from '~/../shared/types/Ranking'
import { useCampeonato } from './useCampeonato'

export const useRanking = () => {
  const supabase = useSupabaseClient()
  const ranking = useState<RankingEntry[]>('ranking-state', () => [])
  const loading = useState<boolean>('ranking-loading', () => false)
  const error = useState<string | null>('ranking-error', () => null)
  const cachedCampId = useState<string>('ranking-cached-camp-id', () => '')

  const fetchRanking = async () => {
    const { campeonatoAtivo, scoringSystem } = useCampeonato()

    if (!campeonatoAtivo.value) {
      ranking.value = []
      cachedCampId.value = ''
      return
    }

    // Se mudou de campeonato, limpa o cache anterior para evitar misturar dados
    if (cachedCampId.value !== campeonatoAtivo.value.id) {
      ranking.value = []
      cachedCampId.value = campeonatoAtivo.value.id
    }

    loading.value = ranking.value.length === 0
    error.value = null
    try {

      // 1. Buscar todos os usuários não-admin
      const { data: usersData, error: userErr } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .eq('is_admin', false)
      
      if (userErr) throw userErr

      // 1.5 Buscar os acessos desses usuários no campeonato ativo (trazendo o escudo/time específico daquele campeonato)
      // @ts-ignore
      const { data: acessosData } = await supabase
        .from('campeonato_acessos')
        .select('email, time_id, times(nome, escudo_url)')
        .eq('campeonato_id', campeonatoAtivo.value.id)

      if (!campeonatoAtivo.value) {
        ranking.value = []
        return
      }

      // Buscar APENAS rodadas referentes ao campeonato selecionado
      const { data: rodadasFiltradas } = await supabase
        .from('rodadas')
        .select('id, multiplicador')
        .eq('campeonato_id', campeonatoAtivo.value.id)
      
      const rodadasMap = new Map(rodadasFiltradas?.map(r => [r.id, r.multiplicador || 1]) || [])
      const rodadasIds = Array.from(rodadasMap.keys())
      if (rodadasIds.length === 0) {
        ranking.value = []
        return
      }

      const { data: betsData, error: betsErr } = await supabase
        .from('palpites')
        .select('usuario_id, pontos, partidas!inner(status, rodada_id)')
        .eq('partidas.status', 'finalizado')
        .in('partidas.rodada_id', rodadasIds)

      // 2.5 Buscar palpites especiais (bônus de 10/5 pts)
      const { data: specialBetsData } = await supabase
        .from('palpites_especiais')
        .select('usuario_id, pontos')
        .eq('campeonato_id', campeonatoAtivo.value.id)

      if (betsErr) throw betsErr

      // 3. Montar Ranking apenas para usuários que têm acesso a este campeonato
      const authorizedUsers = (usersData as any[] || []).filter(u => 
        (acessosData as any[] || []).some(a => a.email.toLowerCase() === u.email.toLowerCase())
      )

      const rawRanking: RankingEntry[] = authorizedUsers.map(u => {
        const userBets = (betsData as any[] || []).filter(b => b.usuario_id === u.id)
        
        // Agregar pontos e acertos baseado no Scoring System
        const regras = scoringSystem.value || { placar_exato: 3, vencedor_correto: 1, errou: 0 }
        let total = 0
        let cravados = 0
        let acertos = 0

        userBets.forEach(b => {
          const mult = rodadasMap.get(b.partidas.rodada_id) || 1
          const realPoints = (b.pontos || 0) * Number(mult)
          total += realPoints
          
          // O maior prêmio do JSON de regras é considerado "Placar Craque" / cravado
          if (b.pontos === regras.placar_exato) {
            cravados++
          } 
          // Qualquer pontuação intermediária é um "Acerto Parcial" para critérios de desempate
          else if (b.pontos !== 0 && b.pontos !== regras.placar_exato) {
            acertos++
          }
        })

        // Somar palpites especiais
        const userSpecials = (specialBetsData as any[] || []).filter(s => s.usuario_id === u.id)
        userSpecials.forEach(s => {
          total += (s.pontos || 0)
        })

        // Time específico selecionado no campeonato
        const acessoUser = (acessosData as any[] || []).find(a => a.email === u.email)

        return {
          usuario_id: u.id,
          nome: u.nome,
          time_id: acessoUser?.time_id || null,
          time_nome: acessoUser?.times?.nome || null,
          escudo_url: acessoUser?.times?.escudo_url || null,
          total_pontos: total,
          total_cravados: cravados,
          total_acertos: acertos,
          total_palpites: userBets.length,
          position: 0
        }
      })

      // Ordenar por: Pontos DESC > Cravados DESC > Acertos DESC > Nome ASC
      const sortedData = rawRanking.sort((a, b) => {
        if (b.total_pontos !== a.total_pontos) return (b.total_pontos || 0) - (a.total_pontos || 0)
        if (b.total_cravados !== a.total_cravados) return (b.total_cravados || 0) - (a.total_cravados || 0)
        if (b.total_acertos !== a.total_acertos) return (b.total_acertos || 0) - (a.total_acertos || 0)
        return a.nome.localeCompare(b.nome)
      }).map((item, index) => ({
        ...item,
        position: index + 1
      }))

      ranking.value = sortedData
    } catch (err: any) {
      console.error('Erro ao calcular ranking manual:', err)
      error.value = err.message || 'Erro ao carregar o ranking'
    } finally {
      loading.value = false
    }
  }

  return {
    ranking,
    loading,
    error,
    fetchRanking
  }
}
