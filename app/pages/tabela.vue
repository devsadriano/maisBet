<template>
  <div class="space-y-10 animate-fade-in relative">
    
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

    <!-- Active Standing Table & Matches Grid -->
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
            @click="fetchStandings(true)"
            class="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" :class="{ 'animate-spin': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Team Crests Horizontal Strip -->
      <div v-if="teamCrests.length > 0" class="bg-white/5 border border-white/10 rounded-2xl p-4 overflow-hidden relative">
        <div class="flex flex-wrap items-center gap-3 sm:gap-4 py-1 px-2 justify-center">
          <img 
            v-for="t in teamCrests" 
            :key="t.name" 
            :src="t.crest" 
            :title="t.name" 
            class="w-8 h-8 object-contain shrink-0 hover:scale-125 hover:rotate-6 transition-all duration-200 cursor-pointer" 
          />
        </div>
      </div>

      <!-- Two-Column Grid Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left Column: Standings Table (8 of 12 columns) -->
        <div class="lg:col-span-8 space-y-6">
          
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

                  <table class="w-full text-left border-separate border-spacing-y-1 table-auto">
                    <thead class="text-[10px] text-gray-500 uppercase font-black tracking-widest border-b border-white/5">
                      <tr>
                        <th class="px-1.5 py-3 text-center w-8">#</th>
                        <th class="px-2 sm:px-3 py-3">Time</th>
                        <th class="px-1.5 py-3 text-center text-brand-400 font-black w-10">PTS</th>
                        <th class="px-1.5 py-3 text-center w-8">J</th>
                        <th class="px-1.5 py-3 text-center w-8">V</th>
                        <th class="px-1.5 py-3 text-center w-8">E</th>
                        <th class="px-1.5 py-3 text-center w-8">D</th>
                        <th class="px-1.5 py-3 text-center w-10 text-emerald-600 dark:text-emerald-400">GP</th>
                        <th class="px-1.5 py-3 text-center w-10 text-red-600 dark:text-red-400">GC</th>
                        <th class="px-1.5 py-3 text-center w-10">SG</th>
                        <th class="px-2 py-3 text-center hidden md:table-cell w-28">Últimas</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr 
                        v-for="(row, idx) in grp.table" 
                        :key="row.team.id"
                        :class="getRowBg(idx)"
                        class="group hover:bg-white/[0.08] transition-colors border border-white/5 overflow-hidden"
                      >
                        <td class="px-1.5 py-3 sm:py-4 text-center font-bebas text-base sm:text-lg rounded-l-xl" :class="getTextColor(idx)">
                          {{ row.position }}
                        </td>
                        <td class="px-2 sm:px-3 py-3 sm:py-4">
                          <div class="flex items-center gap-2 sm:gap-3">
                            <img :src="row.team.crest" class="w-6 h-6 sm:w-7 sm:h-7 object-contain shrink-0" :alt="row.team.name">
                            <span class="font-bold text-xs sm:text-sm text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white truncate max-w-[100px] sm:max-w-[180px] md:max-w-none">{{ row.team.name }}</span>
                          </div>
                        </td>
                        <td class="px-1.5 py-3 sm:py-4 text-center font-bebas text-lg sm:text-xl text-gray-900 dark:text-white font-bold bg-white/5">{{ row.points }}</td>
                        <td class="px-1.5 py-3 sm:py-4 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">{{ row.playedGames }}</td>
                        <td class="px-1.5 py-3 sm:py-4 text-center text-xs text-gray-700 dark:text-gray-300 font-bold">{{ row.won }}</td>
                        <td class="px-1.5 py-3 sm:py-4 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">{{ row.draw }}</td>
                        <td class="px-1.5 py-3 sm:py-4 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">{{ row.lost }}</td>
                        <td class="px-1.5 py-3 sm:py-4 text-center text-xs text-emerald-600 dark:text-emerald-400/90 font-bold">{{ row.goalsFor }}</td>
                        <td class="px-1.5 py-3 sm:py-4 text-center text-xs text-red-600 dark:text-red-400/90 font-bold">{{ row.goalsAgainst }}</td>
                        <td class="px-1.5 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold" :class="row.goalDifference > 0 ? 'text-emerald-600 dark:text-emerald-400' : row.goalDifference < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-450'">
                          {{ row.goalDifference > 0 ? '+' : '' }}{{ row.goalDifference }}
                        </td>
                        <td class="px-2 py-3 sm:py-4 rounded-r-xl hidden md:table-cell">
                          <div class="flex items-center justify-center gap-0.5 sm:gap-1">
                            <div 
                              v-for="(status, sidx) in parseForm(row.form)" 
                              :key="sidx"
                              class="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded flex items-center justify-center text-[8px] sm:text-[9px] font-black text-white"
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

        <!-- Right Column: Round Matches Widget (4 of 12 columns) -->
        <div class="lg:col-span-4 space-y-6">
          <BaseCard variant="pitch" class="border-white/10 relative p-6">
            
            <!-- Heading -->
            <div class="mb-4">
              <h3 class="text-xl font-bebas text-white tracking-wider uppercase">Jogos da Rodada</h3>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Acompanhe as partidas e placares</p>
            </div>

            <!-- Round selector -->
            <div class="flex items-center justify-between py-2 bg-white/5 border border-white/10 rounded-xl px-4 mb-6">
              <button 
                @click="prevRound" 
                :disabled="selectedRound <= 1 || loadingMatches" 
                class="text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white transition-colors z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <!-- Clickable round text with transparent select overlay -->
              <div class="relative flex-1 flex items-center justify-center cursor-pointer hover:bg-white/5 rounded-lg py-1 transition-all mx-2 group">
                <span class="font-bebas text-lg text-white tracking-widest flex items-center gap-1 group-hover:text-brand-400 transition-colors">
                  {{ selectedRound }}ª RODADA
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
                <select 
                  v-model="selectedRound"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  <option 
                    v-for="r in maxRounds" 
                    :key="r" 
                    :value="r"
                    class="bg-[#1c1c1c] text-white font-bebas text-lg"
                  >
                    {{ r }}ª Rodada
                  </option>
                </select>
              </div>

              <button 
                @click="nextRound" 
                :disabled="selectedRound >= maxRounds || loadingMatches" 
                class="text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white transition-colors z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <!-- Matches Loading State -->
            <div v-if="loadingMatches" class="flex flex-col items-center justify-center py-20 gap-3">
              <div class="w-8 h-8 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
              <span class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Carregando jogos...</span>
            </div>

            <!-- Empty State for Matches -->
            <div v-else-if="matches.length === 0" class="text-center py-16 text-sm text-gray-400">
               Nenhum jogo cadastrado para esta rodada.
            </div>

            <!-- Matches List -->
            <div v-else class="space-y-4">
               <div 
                 v-for="m in matches" 
                 :key="m.id"
                 class="p-4 rounded-xl border flex flex-col items-center justify-center gap-2 relative overflow-hidden bg-white/5 border-white/10 hover:border-white/20 transition-all"
                 :class="{
                   'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40': m.is_mandatory,
                   'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40': m.is_extra
                 }"
               >
                 <!-- Badges for bolão games -->
                 <div v-if="m.is_mandatory" class="absolute top-0 right-0 py-0.5 px-2 bg-blue-500 text-white text-[8px] font-black rounded-bl-lg tracking-wider">OBRIGATÓRIO</div>
                 <div v-if="m.is_extra" class="absolute top-0 right-0 py-0.5 px-2 bg-orange-500 text-white text-[8px] font-black rounded-bl-lg tracking-wider">EXTRA</div>

                 <!-- Date and time formatted -->
                 <span class="text-[9px] text-gray-500 font-mono">{{ formatMatchDate(m.data_partida, m.status) }}</span>

                 <!-- Match row: home vs away -->
                 <div class="flex items-center justify-between w-full px-2 gap-2 mt-1">
                   <!-- Home -->
                   <div class="flex-1 flex items-center justify-end gap-2 min-w-0">
                     <span class="text-xs font-bold text-white truncate text-right">{{ m.time_casa }}</span>
                     <img :src="getShieldUrl(m.api_team_home_id)" class="w-6 h-6 object-contain shrink-0" />
                   </div>

                   <!-- Score or 'x' -->
                   <div class="flex items-center gap-1.5 px-2.5 py-0.5 bg-black/35 rounded-lg border border-white/5 text-xs font-black tracking-wider shrink-0 font-mono text-center">
                     <template v-if="m.status === 'finalizado'">
                       <span class="text-white">{{ m.gols_casa }}</span>
                       <span class="text-gray-600">x</span>
                       <span class="text-white">{{ m.gols_fora }}</span>
                     </template>
                     <template v-else-if="m.status === 'adiado'">
                       <span class="text-red-400 uppercase text-[8px] px-1 font-bold">Adiado</span>
                     </template>
                     <template v-else>
                       <span class="text-gray-400">x</span>
                     </template>
                   </div>

                   <!-- Away -->
                   <div class="flex-1 flex items-center justify-start gap-2 min-w-0">
                     <img :src="getShieldUrl(m.api_team_away_id)" class="w-6 h-6 object-contain shrink-0" />
                     <span class="text-xs font-bold text-white truncate text-left">{{ m.time_fora }}</span>
                   </div>
                 </div>

                 <!-- Footer decorative text 'FIQUE POR DENTRO' -->
                 <div class="text-[8px] text-brand-400 font-black uppercase tracking-widest mt-1 opacity-80 hover:opacity-100 transition-opacity cursor-default select-none">
                   Fique por Dentro
                 </div>
               </div>
            </div>

          </BaseCard>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import BaseCard from '~/components/ui/BaseCard.vue'
import BaseButton from '~/components/ui/BaseButton.vue'
import { useCampeonato } from '~/composables/useCampeonato'
import { useToast } from '~/composables/useToast'

const supabase = useSupabaseClient()
const { campeonatoAtivo } = useCampeonato()

// Standings States
const groups = useState<any[]>('table-groups', () => [])
const season = useState<string>('table-season', () => '')
const loading = useState<boolean>('table-loading', () => true)
const error = useState<boolean>('table-error', () => false)
const activeCode = useState<string>('table-active-code', () => '')

const legends = [
  { label: 'Libertadores', color: 'bg-blue-500' },
  { label: 'Pré-Libertadores', color: 'bg-orange-500' },
  { label: 'Sul-Americana', color: 'bg-emerald-500' },
  { label: 'Rebaixamento', color: 'bg-red-500' },
]

// Matches States
const selectedRound = ref(1)
const maxRounds = computed(() => campeonatoAtivo.value?.max_rodadas || 38)
const matches = useState<any[]>('table-matches', () => [])
const loadingMatches = useState<boolean>('table-loading-matches', () => false)
const cachedRoundKey = useState<string>('table-cached-round-key', () => '')
const escudosMap = ref<Record<number, string>>({})

// Unify team crests from standings to render at the top
const teamCrests = computed(() => {
  const list: Array<{ name: string; crest: string }> = []
  groups.value.forEach(g => {
    if (g.table) {
      g.table.forEach((row: any) => {
        if (row.team && row.team.crest) {
          list.push({
            name: row.team.name,
            crest: row.team.crest
          })
        }
      })
    }
  })
  return list
})

// --- Data Fetching ---

const toast = useToast()

async function fetchStandings(force = false) {
  if (!campeonatoAtivo.value) return
  const code = campeonatoAtivo.value.api_competition_code || 'BSA'
  const campSeason = campeonatoAtivo.value.season ? String(campeonatoAtivo.value.season) : undefined

  if (activeCode.value !== code) {
    groups.value = []
    season.value = ''
    activeCode.value = code
  }
  loading.value = groups.value.length === 0
  error.value = false
  try {
    const queryParams: Record<string, string> = { 
      api_competition_code: code,
      refresh: 'true',
      t: String(Date.now())
    }
    if (campSeason) queryParams.season = campSeason

    const data: any = await $fetch(`/api/app/standings`, { query: queryParams })
    groups.value = data.standings || []
    season.value = data.season || ''

    if (force && process.client) {
      toast.success('Tabela de classificação atualizada!')
    }
  } catch (err) {
    console.error(err)
    error.value = true
  } finally {
    loading.value = false
  }
}

async function fetchEscudos() {
  const { data: times } = await supabase.from('times').select('api_team_id, escudo_url')
  if (times) {
    times.forEach((t: any) => {
      escudosMap.value[t.api_team_id] = t.escudo_url
    })
  }
}

function getShieldUrl(apiId: number) {
  return escudosMap.value[apiId] || ''
}

async function fetchCurrentRound() {
  if (!campeonatoAtivo.value) return
  try {
    // 1. Tenta achar rodada aberta ou aguardando escolha (rodada ativa de palpites)
    const { data: openRound } = await supabase
      .from('rodadas')
      .select('numero_rodada')
      .eq('campeonato_id', campeonatoAtivo.value.id)
      .in('status', ['aberta', 'aguardando_escolha'])
      .order('numero_rodada', { ascending: true })
      .limit(1)
      .maybeSingle()
    
    if (openRound) {
      selectedRound.value = openRound.numero_rodada
      return
    }

    // 2. Se não houver aberta/aguardando, tenta achar uma rodada fechada (jogos em andamento)
    const { data: closedRound } = await supabase
      .from('rodadas')
      .select('numero_rodada')
      .eq('campeonato_id', campeonatoAtivo.value.id)
      .eq('status', 'fechada')
      .order('numero_rodada', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (closedRound) {
      selectedRound.value = closedRound.numero_rodada
      return
    }

    // 3. Se não houver fechada, pega a última rodada finalizada
    const { data: lastFinalizedRound } = await supabase
      .from('rodadas')
      .select('numero_rodada')
      .eq('campeonato_id', campeonatoAtivo.value.id)
      .eq('status', 'finalizada')
      .order('numero_rodada', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastFinalizedRound) {
      selectedRound.value = lastFinalizedRound.numero_rodada
      return
    }

    // 4. Se não encontrar nada, tenta pegar a primeira rodada do campeonato cadastrada
    const { data: firstRound } = await supabase
      .from('rodadas')
      .select('numero_rodada')
      .eq('campeonato_id', campeonatoAtivo.value.id)
      .order('numero_rodada', { ascending: true })
      .limit(1)
      .maybeSingle()

    selectedRound.value = firstRound ? firstRound.numero_rodada : 1
  } catch (e) {
    console.error('Erro ao buscar rodada atual:', e)
    selectedRound.value = 1
  }
}

async function fetchMatches() {
  if (!campeonatoAtivo.value) return
  const roundKey = `${campeonatoAtivo.value.id}-${selectedRound.value}`
  if (cachedRoundKey.value !== roundKey) {
    matches.value = []
    cachedRoundKey.value = roundKey
  }
  loadingMatches.value = matches.value.length === 0
  try {
    // 1. Obter a rodada daquele campeonato
    const { data: rd } = await supabase
      .from('rodadas')
      .select('id')
      .eq('campeonato_id', campeonatoAtivo.value.id)
      .eq('numero_rodada', selectedRound.value)
      .maybeSingle()

    if (rd) {
      // 2. Obter as partidas vinculadas à rodada
      const { data: pts } = await supabase
        .from('partidas')
        .select('*')
        .eq('rodada_id', rd.id)
        .order('data_partida', { ascending: true })
      matches.value = pts || []
    } else {
      matches.value = []
    }
  } catch (e) {
    console.error('Erro ao buscar partidas:', e)
    matches.value = []
  } finally {
    loadingMatches.value = false
  }
}

// --- Navigation ---

function prevRound() {
  if (selectedRound.value > 1) {
    selectedRound.value--
  }
}

function nextRound() {
  if (selectedRound.value < maxRounds.value) {
    selectedRound.value++
  }
}

// --- Date Formatter ---

function formatMatchDate(isoString: string, status: string) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const matchDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffTime = matchDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  if (diffDays === 0) {
    return `Hoje • ${timeStr}`
  } else if (diffDays === 1) {
    return `Amanhã • ${timeStr}`
  } else {
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
    const dayMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1)
    return `${capitalized}, ${dayMonth} • ${timeStr}`
  }
}

// --- Standings Helpers ---

function parseForm(formStr?: string) {
  if (!formStr || typeof formStr !== 'string' || !formStr.trim()) {
    return [
      { label: 'V', color: 'bg-emerald-500 shadow-lg shadow-emerald-500/20' },
      { label: 'E', color: 'bg-gray-500' },
      { label: 'V', color: 'bg-emerald-500 shadow-lg shadow-emerald-500/20' },
      { label: 'E', color: 'bg-gray-500' },
      { label: 'V', color: 'bg-emerald-500 shadow-lg shadow-emerald-500/20' }
    ]
  }
  return formStr.split(',').map(s => {
    const trimmed = s ? s.trim().toUpperCase() : ''
    if (trimmed === 'W' || trimmed === 'V') return { label: 'V', color: 'bg-emerald-500 shadow-lg shadow-emerald-500/20' }
    if (trimmed === 'D' || trimmed === 'E') return { label: 'E', color: 'bg-gray-500' }
    if (trimmed === 'L') return { label: 'D', color: 'bg-red-500 shadow-lg shadow-red-500/20' }
    return { label: 'E', color: 'bg-gray-500' }
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

// --- Lifecycles & Watchers ---

let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await fetchEscudos()
  await fetchStandings()
  await fetchCurrentRound()
  await fetchMatches()

  if (process.client) {
    autoRefreshTimer = setInterval(async () => {
      await fetchStandings(true)
      await fetchMatches()
    }, 60000)
  }
})

onUnmounted(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
  }
})

watch(() => campeonatoAtivo.value?.id, async () => {
  await fetchStandings()
  await fetchCurrentRound()
  await fetchMatches()
})

watch(selectedRound, async () => {
  await fetchMatches()
})

// SEO
useHead({
  title: 'Classificação do Campeonato | +BET',
  meta: [
    { name: 'description', content: 'Tabela de classificação oficial do campeonato ativa no bolão.' }
  ]
})
</script>
