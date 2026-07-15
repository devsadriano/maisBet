<template>
  <div class="space-y-10 pb-32 animate-fade-in relative">
    
    <!-- Header Page -->
    <header class="flex items-center justify-between border-b border-white/5 pb-8">
      <div class="space-y-2">
         <NuxtLink to="/" class="text-brand-400 text-xs font-black uppercase tracking-widest hover:text-brand-300 transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao Lobby
         </NuxtLink>
         <h1 class="text-4xl md:text-5xl font-bebas text-white tracking-tighter">
           TABELA <span class="text-brand-500">DE CLASSIFICAÇÃO</span>
         </h1>
      </div>
      
      <div class="hidden md:block">
         <div class="w-16 h-16 bg-brand-500/10 rounded-2xl border border-brand-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
         </div>
      </div>
    </header>

    <!-- Nenhum Bolao Selecionado State -->
    <div v-if="!campeonatoAtivo" class="animate-fade-in-up py-20 text-center">
       <BaseCard variant="pitch" class="max-w-2xl mx-auto border-brand-500/20">
           <div class="py-10">
               <span class="text-6xl mb-6 block drop-shadow-lg opacity-80">🏟️</span>
               <h2 class="text-3xl font-bebas text-white mb-3 tracking-widest uppercase">Nenhum Bolão Selecionado</h2>
               <p class="text-gray-400 text-md max-w-md mx-auto leading-relaxed mb-10">
                 Você precisa escolher um campeonato no Lobby antes de poder visualizar a tabela de classificação oficial.
               </p>
               <div class="flex justify-center">
                   <BaseButton variant="brand" @click="$router.push('/')">Ir para o Lobby</BaseButton>
               </div>
           </div>
       </BaseCard>
    </div>

    <!-- Active Standing Table -->
    <div v-else class="space-y-8 animate-fade-in-up">
      
      <!-- Championship Header Card -->
      <BaseCard variant="pitch" class="relative overflow-hidden">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <img v-if="campeonatoAtivo.logo_url" :src="campeonatoAtivo.logo_url" class="w-10 h-10 object-contain shrink-0" />
            <div>
              <h2 class="text-xl font-bebas text-white tracking-widest uppercase">{{ campeonatoAtivo.nome }}</h2>
              <p class="text-xs text-gray-400 uppercase font-black tracking-wider mt-0.5">Tabela Oficial da Temporada {{ season || 'Carregando...' }}</p>
            </div>
          </div>
          <BaseButton 
            variant="brand" 
            size="sm" 
            :disabled="loading" 
            @click="fetchStandings"
            class="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="{ 'animate-spin': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
            </svg>
            Atualizar
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Table Content -->
      <BaseCard variant="pitch" class="p-0 overflow-hidden border-white/10 relative">
        <div v-if="loading" class="flex flex-col items-center justify-center py-24 gap-4">
           <div class="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
           <span class="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">Buscando classificação oficial...</span>
        </div>

        <div v-else-if="error" class="text-center py-20">
           <p class="text-red-400 font-bold mb-2">Erro ao carregar classificação</p>
           <BaseButton variant="brand" size="sm" @click="fetchStandings">Tentar Novamente</BaseButton>
        </div>

        <template v-else>
          <div class="overflow-x-auto">
            <div v-for="(grp, gIdx) in groups" :key="gIdx" :class="{'mt-8': gIdx > 0}" class="p-4 sm:p-6">
              
              <!-- Group Title (For tournaments with groups like Libertadores/World Cup) -->
              <h3 v-if="grp.group" class="text-white font-bebas text-xl mb-3 px-2 flex items-center gap-2">
                 <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                 {{ grp.group.replace('_', ' ') }}
              </h3>

              <table class="w-full text-left border-separate border-spacing-y-1">
                <thead class="text-[10px] text-gray-500 uppercase font-black tracking-widest border-b border-white/5">
                  <tr>
                    <th class="px-4 py-3 text-center">#</th>
                    <th class="px-4 py-3">Time</th>
                    <th class="px-4 py-3 text-center">J</th>
                    <th class="px-4 py-3 text-center">V</th>
                    <th class="px-4 py-3 text-center">E</th>
                    <th class="px-4 py-3 text-center">D</th>
                    <th class="px-4 py-3 text-center hidden md:table-cell">Gols</th>
                    <th class="px-4 py-3 text-center">SG</th>
                    <th class="px-4 py-3 text-center">PTS</th>
                    <th class="px-4 py-3 text-center">Últimas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="(row, idx) in grp.table" 
                    :key="row.team.id"
                    :class="getRowBg(idx)"
                    class="group hover:bg-white/[0.08] transition-colors border border-white/5 overflow-hidden"
                  >
                    <td class="px-4 py-3.5 text-center font-bebas text-lg rounded-l-xl" :class="getTextColor(idx)">
                      {{ row.position }}
                    </td>
                    <td class="px-4 py-3.5">
                      <div class="flex items-center gap-3">
                        <img :src="row.team.crest" class="w-6 h-6 object-contain" :alt="row.team.name">
                        <span class="font-bold text-sm text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white truncate max-w-[120px] sm:max-w-none">{{ row.team.name }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3.5 text-center text-xs text-gray-500 dark:text-gray-400">{{ row.playedGames }}</td>
                    <td class="px-4 py-3.5 text-center text-xs text-gray-700 dark:text-gray-300 font-bold">{{ row.won }}</td>
                    <td class="px-4 py-3.5 text-center text-xs text-gray-500 dark:text-gray-400">{{ row.draw }}</td>
                    <td class="px-4 py-3.5 text-center text-xs text-gray-500 dark:text-gray-400">{{ row.lost }}</td>
                    <td class="px-4 py-3.5 text-center text-[10px] text-gray-450 dark:text-gray-500 font-mono hidden md:table-cell">{{ row.goalsFor }}:{{ row.goalsAgainst }}</td>
                    <td class="px-4 py-3.5 text-center text-xs font-bold" :class="row.goalDifference > 0 ? 'text-emerald-600 dark:text-emerald-400' : row.goalDifference < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-450'">
                      {{ row.goalDifference > 0 ? '+' : '' }}{{ row.goalDifference }}
                    </td>
                    <td class="px-4 py-3.5 text-center font-bebas text-xl text-gray-800 dark:text-white">{{ row.points }}</td>
                    <td class="px-4 py-3.5 rounded-r-xl">
                      <div class="flex items-center justify-center gap-1">
                        <div 
                          v-for="(status, sidx) in parseForm(row.form)" 
                          :key="sidx"
                          class="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black text-white"
                          :class="status.color"
                        >
                          {{ status.label }}
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
        
        <!-- Legend / Footer (BSA Only) -->
        <div v-if="activeCode === 'BSA' && !loading && !error" class="p-4 border-t border-white/5 bg-white/[0.01] flex flex-wrap gap-4 justify-center sm:justify-start">
           <div v-for="l in legends" :key="l.label" class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" :class="l.color"></div>
              <span class="text-[9px] uppercase font-black tracking-widest text-gray-500">{{ l.label }}</span>
           </div>
        </div>
      </BaseCard>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import BaseCard from '~/components/ui/BaseCard.vue'
import BaseButton from '~/components/ui/BaseButton.vue'
import { useCampeonato } from '~/composables/useCampeonato'

const { campeonatoAtivo } = useCampeonato()

const groups = ref<any[]>([])
const season = ref('')
const loading = ref(true)
const error = ref(false)
const activeCode = ref('')

const legends = [
  { label: 'Libertadores', color: 'bg-blue-500' },
  { label: 'Pré-Libertadores', color: 'bg-orange-500' },
  { label: 'Sul-Americana', color: 'bg-emerald-500' },
  { label: 'Rebaixamento', color: 'bg-red-500' },
]

async function fetchStandings() {
  if (!campeonatoAtivo.value) return
  loading.value = true
  error.value = false
  try {
    const code = campeonatoAtivo.value.api_competition_code || 'BSA'
    activeCode.value = code

    const data: any = await $fetch(`/api/app/standings`, {
      query: { api_competition_code: code }
    })
    groups.value = data.standings || []
    season.value = data.season || ''
  } catch (err) {
    console.error(err)
    error.value = true
  } finally {
    loading.value = false
  }
}

function parseForm(formStr: string) {
  if (!formStr) return []
  return formStr.split(',').map(s => {
    if (s === 'W') return { label: 'V', color: 'bg-emerald-500 shadow-lg shadow-emerald-500/20' }
    if (s === 'D') return { label: 'E', color: 'bg-gray-500' }
    if (s === 'L') return { label: 'D', color: 'bg-red-500 shadow-lg shadow-red-500/20' }
    return { label: '?', color: 'bg-gray-700' }
  })
}

const getRowBg = (idx: number | string) => {
  if (activeCode.value !== 'BSA') return 'bg-white/[0.02] dark:bg-white/[0.02]'
  const i = Number(idx)
  if (i < 4) return 'bg-blue-500/[0.08] dark:bg-blue-500/[0.05]'
  if (i >= 4 && i < 6) return 'bg-orange-500/[0.08] dark:bg-orange-500/[0.05]'
  if (i >= 6 && i < 12) return 'bg-emerald-500/[0.08] dark:bg-emerald-500/[0.05]'
  if (i >= 16) return 'bg-red-500/[0.08] dark:bg-red-500/[0.05]'
  return 'bg-white/[0.02] dark:bg-white/[0.02]'
}

const getTextColor = (idx: number | string) => {
  if (activeCode.value !== 'BSA') return 'text-gray-550 dark:text-gray-405'
  const i = Number(idx)
  if (i < 4) return 'text-blue-600 dark:text-blue-400'
  if (i >= 16) return 'text-red-600 dark:text-red-400'
  return 'text-gray-500 dark:text-gray-400'
}

onMounted(() => {
  fetchStandings()
})

watch(() => campeonatoAtivo.value?.id, () => {
  fetchStandings()
})

// SEO
useHead({
  title: 'Classificação do Campeonato | +BET',
  meta: [
    { name: 'description', content: 'Tabela de classificação oficial do campeonato ativa no bolão.' }
  ]
})
</script>
