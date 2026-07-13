<template>
  <div class="space-y-8 pb-10">
    <!-- Header Page -->
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
      <div class="space-y-4">
        <h1 class="text-4xl md:text-5xl font-bebas tracking-tighter text-white leading-none flex flex-wrap items-center gap-x-4">
          DASHBOARD <span class="text-brand-500">DA COMPETIÇÃO</span>
        </h1>
        <div class="flex items-center gap-3">
          <BaseBadge variant="brand" pulse>Painel Oficial</BaseBadge>
          <div class="h-1 w-1 rounded-full bg-white/20" />
          <p class="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Live Results Hub</p>
        </div>
      </div>
      
      <BaseTab v-model="activeTab" :options="tabs" />
    </header>

    <!-- Content Area -->
    <main class="min-h-[600px]">
      
      <!-- Nenhum Bolao Selecionado State -->
      <div v-if="!campeonatoAtivo" class="animate-fade-in-up py-20 text-center">
         <BaseCard variant="pitch" class="max-w-2xl mx-auto border-brand-500/20">
             <div class="py-10">
                 <span class="text-6xl mb-6 block drop-shadow-lg opacity-80">🏟️</span>
                 <h2 class="text-3xl font-bebas text-white mb-3 tracking-widest uppercase">Nenhum Bolão Selecionado</h2>
                 <p class="text-gray-400 text-md max-w-md mx-auto leading-relaxed mb-10">
                   Você precisa escolher um campeonato no Lobby antes de poder visualizar as estatísticas e rankings.
                 </p>
                 
                 <div class="flex justify-center">
                    <!-- BaseButton tem import? Não nesse contexto, ou global. Melhor usar tag router-link simples para nao correr risco -->
                    <NuxtLink to="/" class="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-[var(--brand)]/30">
                       VOLTAR AO LOBBY
                    </NuxtLink>
                 </div>
             </div>
         </BaseCard>
      </div>

      <!-- TAB 1: RANKING GERAL -->
      <div v-else-if="activeTab === 'geral'" class="animate-fade-in-up">
        <div v-if="loadingGeral" class="flex flex-col items-center justify-center py-20">
          <div class="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-4" />
          <span class="text-brand-400 font-bebas text-xl">Calculando Pontuações...</span>
        </div>

        <template v-else>
          <RankingPodium :top-three="topThree" />

          <RankingGeneralTable 
            v-if="ranking.length > 0" 
            :entries="ranking" 
            :current-user-id="user?.id || ''" 
          />

          <RankingShameZone 
            v-if="ranking.length >= 3" 
            :entries="ranking" 
          />

          <div v-else class="py-20 text-center">
            <div class="text-6xl grayscale opacity-20 mb-6 font-bebas">🏆</div>
            <h2 class="text-3xl font-bebas tracking-wider text-gray-400 uppercase">O Campeonato ainda não começou</h2>
            <p class="text-gray-500 max-w-sm mx-auto text-sm mt-4">Nenhum competidor pontuou ainda.</p>
          </div>
        </template>
      </div>

      <!-- TAB 2: VISÃO POR RODADA -->
      <div v-else-if="activeTab === 'rodada'" class="space-y-8 animate-fade-in-up">
        <RankingRoundControls 
          v-model="selectedRoundId"
          :rounds="rounds"
          :average-points="averagePoints"
          :round-status="roundStatus"
        />

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 items-start">
          <div class="min-w-0">
            <RankingMatchesPanel 
              :matches="matches" 
              :loading="loadingRound"
              :round-ranking="roundRanking"
            />
          </div>

          <div class="min-w-0">
            <RankingMatrixTable 
              :active-users="activeUsers"
              :matches="matches"
              :matrix="matrix"
              :round-ranking="roundRanking"
              :current-user-id="user?.id || ''"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useCampeonato } from '~/composables/useCampeonato'

// Import Base UI Components
import BaseBadge from '~/components/ui/BaseBadge.vue'
import BaseTab from '~/components/ui/BaseTab.vue'

// Import Ranking Components
import RankingPodium from '~/components/ranking/RankingPodium.vue'
import RankingGeneralTable from '~/components/ranking/RankingGeneralTable.vue'
import RankingRoundControls from '~/components/ranking/RankingRoundControls.vue'
import RankingMatchesPanel from '~/components/ranking/RankingMatchesPanel.vue'
import RankingMatrixTable from '~/components/ranking/RankingMatrixTable.vue'
import RankingShameZone from '~/components/ranking/RankingShameZone.vue'

// Composables
const { user } = useAuth()
const { ranking, loading: loadingGeral, fetchRanking } = useRanking()
const { 
  rounds, 
  selectedRoundId, 
  matches, 
  matrix, 
  roundRanking, 
  loading: loadingRound, 
  fetchRounds, 
  fetchRoundData 
} = useRoundRanking()

// Local State
const activeTab = ref('geral')
const tabs = [
  { id: 'geral', label: 'Ranking Geral' },
  { id: 'rodada', label: 'Visão por Rodada' }
]

const { campeonatoAtivo } = useCampeonato()

// Initialization
onMounted(async () => {
    fetchRanking()
    await fetchRounds()
    if (selectedRoundId.value) fetchRoundData()
})

watch(campeonatoAtivo, async () => {
    fetchRanking()
    await fetchRounds()
    if (selectedRoundId.value) fetchRoundData()
})

watch(selectedRoundId, (newId) => {
    if (newId) fetchRoundData()
})

// Computed Props
const topThree = computed(() => ranking.value.slice(0, 3))

const activeUsers = computed(() => {
    return ranking.value.slice().sort((a, b) => a.nome.localeCompare(b.nome)) as any[]
})

const averagePoints = computed(() => {
    if (roundRanking.value.length === 0) return 0
    const total = roundRanking.value.reduce((acc, curr) => acc + (curr.total_pontos || 0), 0)
    return total / roundRanking.value.length
})

const roundStatus = computed(() => {
    const current = rounds.value.find(r => r.id === (selectedRoundId.value || ''))
    if (!current) return '-'
    if (current.status === 'finalizada') return 'Finalizada'
    if (current.status === 'aberta') return 'Em Aberto'
    return current.status.replace('_', ' ')
})

// SEO
useHead({
  title: 'Ranking Dashboard | +BET',
  meta: [
    { name: 'description', content: 'Classificação geral e desempenho rodada a rodada do +BET.' }
  ]
})
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
