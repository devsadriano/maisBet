<script setup lang="ts">
import { ref, computed } from 'vue'

interface User {
  usuario_id: string
  nome: string
}

interface Match {
  id: string
  time_casa: string
  time_fora: string
  gols_casa?: number | null
  gols_fora?: number | null
  status: string
}

const props = defineProps<{
  activeUsers: User[]
  matches: Match[]
  matrix: Record<string, Record<string, any>>
  roundRanking: any[]
  currentUserId?: string
}>()

const userFilter = ref<'todos' | 'top3' | 'eu'>('todos')

const filteredUsers = computed(() => {
  if (userFilter.value === 'eu' && props.currentUserId) {
    const me = props.activeUsers.find(u => u.usuario_id === props.currentUserId)
    return me ? [me] : props.activeUsers
  }
  if (userFilter.value === 'top3' && props.roundRanking?.length) {
    const top3Ids = [...props.roundRanking]
      .sort((a, b) => (b.total_pontos || 0) - (a.total_pontos || 0))
      .slice(0, 3)
      .map(u => u.usuario_id)
    const topUsers = props.activeUsers.filter(u => top3Ids.includes(u.usuario_id))
    return topUsers.length > 0 ? topUsers : props.activeUsers.slice(0, 3)
  }
  return props.activeUsers
})

interface MatrixEntry {
  palpite_casa?: number | null
  palpite_fora?: number | null
  pontos?: number | null
}

const getEntry = (userId: string, matchId: string): MatrixEntry | undefined => {
  return props.matrix[userId]?.[matchId]
}

const getPoints = (userId: string, matchId: string): number | null => {
  const entry = getEntry(userId, matchId)
  if (entry === undefined) return null
  return entry?.pontos ?? null
}

const getTagConfig = (pts: number | null, matchStatus: string) => {
  if (pts === null) return null // Nenhum palpite ou pontuação base
  
  if (matchStatus !== 'finalizado') {
    if (matchStatus === 'em_andamento') return { label: 'Ao Vivo', cls: 'bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/40 animate-pulse' }
    if (matchStatus === 'adiado') return { label: 'Adiado', cls: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500/50 border border-yellow-500/10' }
    return { label: 'Aguardando', cls: 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/30 border border-gray-200 dark:border-white/10' }
  }

  if (pts === 3) return { label: 'Cravado', cls: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40' }
  if (pts === 1) return { label: 'Correto', cls: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/40' }
  
  return { label: 'Erro', cls: 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/30 border border-gray-200 dark:border-white/10' }
}

const getUserTotalForRound = (userId: string) => {
  const user = props.roundRanking.find(u => u.usuario_id === userId)
  return user?.total_pontos || 0
}

const abbrev = (name: string) =>
  name.replace(/^(S\.C\.|S\.E\.|Sport Club|Esporte Clube|Clube de Regatas|Clube|Associação|Sociedade)\s*/i, '')
    .trim()

// For single-user view: show the current user's results first
const viewUser = computed(() =>
  props.activeUsers.find(u => u.usuario_id === props.currentUserId) || props.activeUsers[0]
)
</script>

<template>
  <div class="bg-white/[0.04] border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col min-w-0">
    <!-- Header with Legend & Quick Filter Chips -->
    <div class="bg-white/5 border-b border-white/10 py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-white font-black uppercase tracking-[0.15em] text-sm mb-1.5">Resultados Individuais</h3>
        <div class="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
          <div class="flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-sm bg-emerald-500" />
            <span class="text-emerald-600 dark:text-emerald-400 font-bold">Cravado</span>
            <span class="text-emerald-700 dark:text-emerald-300 font-bold lowercase">(3 pts)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-sm bg-yellow-500" />
            <span class="text-yellow-600 dark:text-yellow-400 font-bold">Correto</span>
            <span class="text-yellow-700 dark:text-yellow-300 font-bold lowercase">(1 pt)</span>
          </div>
          <div class="flex items-center gap-1.5 opacity-80">
            <div class="w-2 h-2 rounded-sm bg-gray-400 dark:bg-white/30 border border-gray-400 dark:border-white/30" />
            <span class="text-gray-600 dark:text-gray-300 font-bold">Erro</span>
            <span class="text-gray-500 dark:text-gray-400 font-bold lowercase">(0 pts)</span>
          </div>
        </div>
      </div>

      <!-- Quick Filter Chips (Top Right) -->
      <div class="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
        <button
          @click="userFilter = 'todos'"
          class="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border"
          :class="userFilter === 'todos' 
            ? 'bg-brand-500 text-black border-brand-400 shadow-lg shadow-brand-500/20 scale-[1.02]' 
            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'"
        >
          👥 Todos
        </button>
        <button
          @click="userFilter = 'top3'"
          class="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border"
          :class="userFilter === 'top3' 
            ? 'bg-brand-500 text-black border-brand-400 shadow-lg shadow-brand-500/20 scale-[1.02]' 
            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'"
        >
          🏆 Top 3
        </button>
        <button
          @click="userFilter = 'eu'"
          class="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border"
          :class="userFilter === 'eu' 
            ? 'bg-brand-500 text-black border-brand-400 shadow-lg shadow-brand-500/20 scale-[1.02]' 
            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'"
        >
          👤 Apenas Eu
        </button>
      </div>
    </div>

    <!-- No users state -->
    <div v-if="filteredUsers.length === 0 || matches.length === 0" class="flex-1 flex items-center justify-center py-16 text-gray-500 text-sm italic">
      Nenhum dado disponível para esta rodada.
    </div>

    <!-- User tabs (scroll if many) -->
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <div v-if="filteredUsers.length > 1" class="flex gap-1 px-4 py-3 overflow-x-auto hide-scrollbar border-b border-white/5">
        <!-- user selector tabs here if needed -->
      </div>

      <!-- Table -->
      <div class="overflow-x-auto flex-1 custom-scrollbar -mx-0">
        <table class="text-left border-collapse min-w-full table-fixed">
          <thead class="sticky top-0 bg-pitch-900 z-30">
            <tr>
              <th class="sticky left-0 z-20 bg-pitch-900 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-500 w-[160px] min-w-[160px] max-w-[160px]">Jogo</th>
              <th class="sticky left-[160px] z-20 bg-pitch-900 px-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-white/40 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-white/5 w-[80px] min-w-[80px] max-w-[80px] text-center">Placar</th>
              <th 
                v-for="u in filteredUsers" 
                :key="u.usuario_id"
                class="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-center w-[90px] sm:w-[110px] min-w-[90px] sm:min-w-[110px] max-w-[90px] sm:max-w-[110px]"
                :class="u.usuario_id === currentUserId ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-white/40'"
              >
                <div class="truncate px-1">{{ u.nome.split(' ')[0] }}</div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.04]">
            <tr 
              v-for="match in matches" 
              :key="match.id"
              class="hover:bg-white/[0.03] transition-colors group"
            >
              <!-- Match Name - Stacked Layout -->
              <td class="sticky left-0 z-10 bg-[#fbfbfb] dark:bg-pitch-900 group-hover:bg-gray-100 dark:group-hover:bg-[#1a1a1a] px-4 py-3.5 sm:py-4.5 lg:py-5 transition-colors w-[160px] min-w-[160px] max-w-[160px]">
                <div class="flex flex-col gap-0.5">
                  <span class="text-gray-800 dark:text-white/90 text-xs sm:text-sm font-bold leading-snug truncate">{{ abbrev(match.time_casa) }}</span>
                  <span class="text-gray-400 dark:text-white/25 text-[8px] sm:text-[9px] font-black uppercase tracking-widest leading-none">vs</span>
                  <span class="text-gray-800 dark:text-white/90 text-xs sm:text-sm font-bold leading-snug truncate">{{ abbrev(match.time_fora) }}</span>
                </div>
              </td>

              <!-- Real Score -->
              <td class="sticky left-[160px] z-10 bg-[#fbfbfb] dark:bg-pitch-900 group-hover:bg-gray-100 dark:group-hover:bg-[#1a1a1a] px-2 py-3.5 sm:py-4.5 lg:py-5 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-white/5 transition-colors w-[80px] min-w-[80px] max-w-[80px]">
                <div class="flex flex-col sm:flex-row sm:items-center justify-center items-center gap-0.5 sm:gap-1.5 font-bebas text-sm sm:text-lg leading-tight sm:leading-none">
                  <template v-if="match.status === 'finalizado'">
                    <span class="text-brand-600 dark:text-brand-400 font-bold">{{ match.gols_casa }}</span>
                    <span class="text-gray-400 dark:text-white/20 text-[10px] hidden sm:inline">×</span>
                    <span class="text-brand-600 dark:text-brand-400 font-bold">{{ match.gols_fora }}</span>
                  </template>
                  <span v-else class="text-gray-400 dark:text-white/20 text-xs italic">—</span>
                </div>
              </td>

              <!-- Per-user result cells -->
              <td 
                v-for="u in filteredUsers" 
                :key="u.usuario_id"
                class="px-3 py-3.5 sm:py-4.5 lg:py-5 text-center"
                :class="u.usuario_id === currentUserId ? 'bg-brand-500/[0.03]' : ''"
              >
                <div class="flex flex-col items-center gap-1.5">
                  <!-- Palpite -->
                  <div v-if="getEntry(u.usuario_id, match.id)" class="text-gray-600 dark:text-white/60 text-[11px] font-mono font-bold flex flex-col sm:flex-row sm:gap-0.5 items-center leading-tight sm:leading-none">
                    <span>{{ getEntry(u.usuario_id, match.id)?.palpite_casa ?? '?' }}</span>
                    <span class="hidden sm:inline">×</span>
                    <span>{{ getEntry(u.usuario_id, match.id)?.palpite_fora ?? '?' }}</span>
                  </div>
                  <div v-else class="text-gray-300 dark:text-white/10 text-[10px]">—</div>
                  
                  <!-- Tag -->
                  <div v-if="getTagConfig(getPoints(u.usuario_id, match.id), match.status)" class="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide" :class="getTagConfig(getPoints(u.usuario_id, match.id), match.status)!.cls">
                    {{ getTagConfig(getPoints(u.usuario_id, match.id), match.status)!.label }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>

          <!-- Footer: SOMA -->
          <tfoot class="sticky bottom-0 z-20">
            <tr class="border-t-2 border-brand-500/20 bg-brand-500/5 backdrop-blur-md">
              <td class="sticky left-0 z-10 bg-[#fbfbfb] dark:bg-pitch-900 px-4 py-3 font-bebas text-lg sm:text-xl text-brand-600 dark:text-brand-400 tracking-widest uppercase w-[160px] min-w-[160px] max-w-[160px]">
                <span class="text-[9px] font-sans font-black text-brand-600/50 dark:text-white/20 block leading-none mb-0.5">Total</span>
                SOMA
              </td>
              <td class="sticky left-[160px] z-10 bg-[#fbfbfb] dark:bg-pitch-900 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-white/5 w-[80px] min-w-[80px] max-w-[80px]"></td>
              <td 
                v-for="u in filteredUsers" 
                :key="u.usuario_id"
                class="px-3 py-3 text-center font-bebas text-xl sm:text-2xl text-brand-600 dark:text-brand-400"
                :class="u.usuario_id === currentUserId ? 'text-brand-700 dark:text-brand-300' : ''"
              >
                {{ getUserTotalForRound(u.usuario_id) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 14px;
  width: 14px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  border: 3px solid transparent;
  background-clip: padding-box;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #00e87a;
}
.custom-scrollbar {
  scrollbar-width: auto;
  scrollbar-color: rgba(255, 255, 255, 0.4) rgba(0, 0, 0, 0.4);
}
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
