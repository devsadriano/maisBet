<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      
      <!-- Modal Container -->
      <div class="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up relative">
        
        <!-- Header -->
        <div class="p-4 sm:p-6 border-b border-white/5 flex items-start sm:items-center justify-between bg-white/[0.02]">
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
             </div>
             <div>
                <h2 class="text-2xl font-bebas tracking-wider text-white">Tabela - <span class="text-emerald-500">Classificação</span></h2>
                
                <!-- Admin Mode: Custom Dropdown -->
                <div v-if="adminMode && campeonatosAdmin.length > 0" class="mt-1 relative w-full sm:w-64 z-50">
                  <button 
                    @click="dropdownOpen = !dropdownOpen"
                    class="w-full flex items-center justify-between bg-black/40 border border-white/10 text-white rounded-lg px-3 py-1.5 outline-none hover:border-brand-500/50 hover:bg-white/[0.04] transition-all text-left group"
                  >
                    <span class="truncate pr-2 font-medium text-xs">
                      {{ campeonatosAdmin.find(c => c.api_competition_code === activeCode)?.nome 
                         ? `${campeonatosAdmin.find(c => c.api_competition_code === activeCode)?.nome} (${campeonatosAdmin.find(c => c.api_competition_code === activeCode)?.season})` 
                         : 'Selecione...' }}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transition-transform group-hover:text-brand-400 shrink-0" :class="dropdownOpen ? 'rotate-180 text-brand-400' : 'text-gray-500'" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>

                  <div v-if="dropdownOpen" class="absolute left-0 w-full mt-1 bg-pitch-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 animate-fade-in-up z-50 max-h-64 overflow-y-auto custom-scrollbar">
                    <button 
                      v-for="c in campeonatosAdmin" :key="c.id"
                      class="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center justify-between"
                      :class="c.api_competition_code === activeCode ? 'bg-brand-500/10 text-brand-400 font-bold' : 'text-gray-300'"
                      @click="handleAdminChampSelect(c.api_competition_code)"
                    >
                      <span class="truncate flex-1">{{ c.nome }}</span>
                      <span v-if="c.api_competition_code === activeCode" class="text-brand-400 text-[10px] ml-2">✔</span>
                    </button>
                  </div>
                </div>

                <!-- Normal Mode -->
                <p v-else class="text-xs text-gray-500 uppercase font-black tracking-widest">{{ season }}</p>
             </div>
          </div>
          <button @click="$emit('close')" class="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-black/20">
          <div v-if="loading" class="flex flex-col items-center justify-center py-24 gap-4">
             <div class="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
             <span class="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">Sincronizando Dados...</span>
          </div>

          <div v-else-if="error" class="text-center py-20">
             <p class="text-red-400 font-bold mb-2">Erro ao carregar classificação</p>
             <button @click="fetchStandings" class="text-xs text-blue-400 underline uppercase tracking-widest font-black">Tentar Novamente</button>
          </div>

          <template v-else>
            <div v-for="(grp, gIdx) in groups" :key="gIdx" :class="{'mt-8': gIdx > 0}">
              <!-- Group Title -->
              <h3 v-if="grp.group" class="text-white font-bebas text-xl mb-3 px-2 flex items-center gap-2">
                 <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                 {{ grp.group.replace('_', ' ') }}
              </h3>

              <table class="w-full text-left border-separate border-spacing-y-1">
                <thead class="text-[10px] text-gray-500 uppercase font-black tracking-widest border-b border-white/5">
                  <tr>
                    <th class="px-1.5 py-3 text-center w-8">#</th>
                    <th class="px-2 sm:px-3 py-3">Time</th>
                    <th class="px-1.5 py-3 text-center text-emerald-400 font-black w-10">PTS</th>
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
                    <td class="px-1.5 py-3 sm:py-3.5 text-center font-bebas text-base sm:text-lg" :class="getTextColor(idx)">
                      {{ row.position }}
                    </td>
                    <td class="px-2 sm:px-3 py-3 sm:py-3.5">
                      <div class="flex items-center gap-2 sm:gap-3">
                        <img :src="row.team.crest" class="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0" :alt="row.team.name">
                        <span class="font-bold text-xs sm:text-sm text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white truncate max-w-[100px] sm:max-w-[180px] md:max-w-none">{{ row.team.name }}</span>
                      </div>
                    </td>
                    <td class="px-1.5 py-3 sm:py-3.5 text-center font-bebas text-lg sm:text-xl text-gray-900 dark:text-white font-bold bg-white/5">{{ row.points }}</td>
                    <td class="px-1.5 py-3 sm:py-3.5 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">{{ row.playedGames }}</td>
                    <td class="px-1.5 py-3 sm:py-3.5 text-center text-xs text-gray-700 dark:text-gray-300 font-bold">{{ row.won }}</td>
                    <td class="px-1.5 py-3 sm:py-3.5 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">{{ row.draw }}</td>
                    <td class="px-1.5 py-3 sm:py-3.5 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">{{ row.lost }}</td>
                    <td class="px-1.5 py-3 sm:py-3.5 text-center text-xs text-emerald-600 dark:text-emerald-400/90 font-bold">{{ row.goalsFor }}</td>
                    <td class="px-1.5 py-3 sm:py-3.5 text-center text-xs text-red-600 dark:text-red-400/90 font-bold">{{ row.goalsAgainst }}</td>
                    <td class="px-1.5 py-3 sm:py-3.5 text-center text-xs sm:text-sm font-bold" :class="row.goalDifference > 0 ? 'text-emerald-600 dark:text-emerald-400' : row.goalDifference < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-450'">
                      {{ row.goalDifference > 0 ? '+' : '' }}{{ row.goalDifference }}
                    </td>
                    <td class="px-2 py-3 sm:py-3.5 hidden md:table-cell">
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
          </template>
        </div>

        <!-- Footer / Legend (Only show if BSA) -->
        <div v-if="activeCode === 'BSA'" class="p-4 border-t border-white/5 bg-white/[0.01] flex flex-wrap gap-4 justify-center sm:justify-start">
           <div v-for="l in legends" :key="l.label" class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" :class="l.color"></div>
              <span class="text-[9px] uppercase font-black tracking-widest text-gray-500">{{ l.label }}</span>
           </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useCampeonato } from '~/composables/useCampeonato'

const props = defineProps<{
  show: boolean,
  competitionCode?: string,
  adminMode?: boolean
}>()

defineEmits(['close'])

const supabase = useSupabaseClient<any>()
const groups = ref<any[]>([])
const season = ref('')
const loading = ref(true)
const error = ref(false)
const activeCode = ref('')
const campeonatosAdmin = ref<any[]>([])
const dropdownOpen = ref(false)

const legends = [
  { label: 'Libertadores', color: 'bg-blue-500' },
  { label: 'Pré-Libertadores', color: 'bg-orange-500' },
  { label: 'Sul-Americana', color: 'bg-emerald-500' },
  { label: 'Rebaixamento', color: 'bg-red-500' },
]

async function fetchAdminChamps() {
  const { data } = await supabase.from('campeonatos').select('*').order('created_at', { ascending: false })
  if (data) {
    campeonatosAdmin.value = data
  }
}

async function fetchStandings() {
  loading.value = true
  error.value = false
  try {
    let code = props.competitionCode

    // Se estiver em modo admin, tentamos primeiro o código selecionado ou o primeiro campeonato da lista
    if (props.adminMode) {
      if (campeonatosAdmin.value.length === 0) await fetchAdminChamps()
      if (!activeCode.value && campeonatosAdmin.value.length > 0) {
         activeCode.value = campeonatosAdmin.value[0].api_competition_code
      }
      code = activeCode.value
    } else {
      const { campeonatoAtivo } = useCampeonato()
      code = code || campeonatoAtivo.value?.api_competition_code || 'BSA'
      activeCode.value = code
    }

    if (!code) throw new Error('No competition code')

    const data: any = await $fetch(`/api/app/standings`, {
      query: {
        api_competition_code: code,
        refresh: 'true',
        t: String(Date.now())
      }
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

function handleAdminChampSelect(code: string) {
  activeCode.value = code
  dropdownOpen.value = false
  fetchStandings()
}

onMounted(() => {
  if (props.show) fetchStandings()
})

const getRowBg = (idx: number | string) => {
  if (activeCode.value !== 'BSA') return 'bg-white/[0.02] dark:bg-white/[0.02]'

  const i = Number(idx)
  // Lógica de cores baseada na posição para o Brasileirão (0-indexed)
  if (i < 4) return 'bg-blue-500/[0.08] dark:bg-blue-500/[0.05]'           // G4 - Libertadores
  if (i >= 4 && i < 6) return 'bg-orange-500/[0.08] dark:bg-orange-500/[0.05]' // G6 - Pré
  if (i >= 6 && i < 12) return 'bg-emerald-500/[0.08] dark:bg-emerald-500/[0.05]' // G12 - Sula
  if (i >= 16) return 'bg-red-500/[0.08] dark:bg-red-500/[0.05]'         // Z4 - Rebaixamento
  return 'bg-white/[0.02] dark:bg-white/[0.02]'
}

const getTextColor = (idx: number | string) => {
  if (activeCode.value !== 'BSA') return 'text-gray-555 dark:text-gray-405'

  const i = Number(idx)
  if (i < 4) return 'text-blue-600 dark:text-blue-400'
  if (i >= 16) return 'text-red-600 dark:text-red-400'
  return 'text-gray-500 dark:text-gray-400'
}

const parseForm = (formStr?: string) => {
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

// Watcher para recarregar se abrir
watch(() => props.show, (newVal) => {
  if (newVal) {
     if (props.adminMode) fetchAdminChamps().then(fetchStandings)
     else fetchStandings()
  }
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 12px;
  height: 14px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.35);
  border-radius: 8px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--brand-500, #00e87a);
}

.animate-fade-in { animation: fadeIn 0.2s ease-out; }
.animate-fade-in-up { animation: fadeInUp 0.3s ease-out; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
