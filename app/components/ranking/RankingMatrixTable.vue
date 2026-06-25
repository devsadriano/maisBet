<script setup lang="ts">
import { computed } from 'vue'

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
  name.replace(/^(S\.C\.|Atlético|Sport Club|Esporte Clube|Clube de Regatas|Clube)\s*/i, '')
    .trim()
    .substring(0, 12)

// For single-user view: show the current user's results first
const viewUser = computed(() =>
  props.activeUsers.find(u => u.usuario_id === props.currentUserId) || props.activeUsers[0]
)
</script>

<template>
  <div class="bg-white/[0.04] border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col min-w-0">
    <!-- Header with Legend -->
    <div class="bg-white/5 border-b border-white/10 py-4 px-6 flex flex-col gap-3">
      <h3 class="text-white font-black uppercase tracking-[0.15em] text-sm">Resultados Individuais</h3>
      <div class="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
        <div class="flex items-center gap-1.5">
          <div class="w-2 h-2 rounded-sm bg-emerald-500" />
          <span class="text-emerald-600 dark:text-emerald-400">Cravado</span>
          <span class="text-gray-500 dark:text-white/30 font-normal lowercase">(3 pts)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-2 h-2 rounded-sm bg-yellow-500" />
          <span class="text-yellow-600 dark:text-yellow-400">Correto</span>
          <span class="text-gray-500 dark:text-white/30 font-normal lowercase">(1 pt)</span>
        </div>
        <div class="flex items-center gap-1.5 opacity-50">
          <div class="w-2 h-2 rounded-sm bg-gray-300 dark:bg-white/20 border border-gray-400 dark:border-white/20" />
          <span class="text-gray-600 dark:text-white/40">Erro</span>
          <span class="text-gray-500 dark:text-white/30 font-normal lowercase">(0 pts)</span>
        </div>
      </div>
    </div>

    <!-- No users state -->
    <div v-if="activeUsers.length === 0 || matches.length === 0" class="flex-1 flex items-center justify-center py-16 text-gray-500 text-sm italic">
      Nenhum dado disponível para esta rodada.
    </div>

    <!-- User tabs (scroll if many) -->
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <div v-if="activeUsers.length > 1" class="flex gap-1 px-4 py-3 overflow-x-auto hide-scrollbar border-b border-white/5">
        <!-- user selector tabs here if needed -->
      </div>

      <!-- Table -->
      <div class="overflow-x-auto flex-1 custom-scrollbar -mx-0">
        <table class="text-left border-collapse min-w-[600px] w-full">
          <thead class="sticky top-0 bg-pitch-900 z-30">
            <tr>
              <th class="sticky left-0 z-20 bg-pitch-900 px-3 sm:px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-500 w-32 sm:w-40">Jogo</th>
              <th class="sticky left-32 sm:left-40 z-20 bg-pitch-900 px-3 sm:px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-white/40 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-white/5">Placar</th>
              <th 
                v-for="u in activeUsers" 
                :key="u.usuario_id"
                class="px-3 py-3 text-[10px] font-black uppercase tracking-wide text-center min-w-[90px] max-w-[100px]"
                :class="u.usuario_id === currentUserId ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-white/40'"
              >
                {{ u.nome.split(' ')[0] }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.04]">
            <tr 
              v-for="match in matches" 
              :key="match.id"
              class="hover:bg-white/[0.03] transition-colors group"
            >
              <!-- Match Name -->
              <td class="sticky left-0 z-10 bg-[#fbfbfb] dark:bg-pitch-900 group-hover:bg-gray-100 dark:group-hover:bg-[#1a1a1a] px-3 sm:px-5 py-3.5 transition-colors w-32 sm:w-40">
                <div class="flex items-center gap-1 text-xs sm:text-sm font-semibold leading-none">
                  <span class="text-gray-800 dark:text-white/90 whitespace-nowrap">{{ abbrev(match.time_casa) }}</span>
                  <span class="text-gray-400 dark:text-white/30 text-[10px]">x</span>
                  <span class="text-gray-800 dark:text-white/90 whitespace-nowrap">{{ abbrev(match.time_fora) }}</span>
                </div>
              </td>

              <!-- Real Score -->
              <td class="sticky left-32 sm:left-40 z-10 bg-[#fbfbfb] dark:bg-pitch-900 group-hover:bg-gray-100 dark:group-hover:bg-[#1a1a1a] px-3 sm:px-4 py-3.5 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-white/5 transition-colors">
                <div class="flex items-center gap-1">
                  <span v-if="match.status === 'finalizado'" class="font-bebas text-base text-brand-600 dark:text-brand-400 leading-none pt-0.5">
                    {{ match.gols_casa }} × {{ match.gols_fora }}
                  </span>
                  <span v-else class="text-gray-400 dark:text-white/20 text-xs italic">—</span>
                </div>
              </td>

              <!-- Per-user result cells -->
              <td 
                v-for="u in activeUsers" 
                :key="u.usuario_id"
                class="px-3 py-3 text-center"
                :class="u.usuario_id === currentUserId ? 'bg-brand-500/[0.03]' : ''"
              >
                <div class="flex flex-col items-center gap-1">
                  <!-- Palpite -->
                  <div v-if="getEntry(u.usuario_id, match.id)" class="text-gray-500 dark:text-white/40 text-[10px] font-mono whitespace-nowrap">
                    {{ getEntry(u.usuario_id, match.id)?.palpite_casa ?? '?' }} × {{ getEntry(u.usuario_id, match.id)?.palpite_fora ?? '?' }}
                  </div>
                  <div v-else class="text-gray-300 dark:text-white/10 text-[10px]">—</div>
                  
                  <!-- Tag -->
                  <div v-if="getTagConfig(getPoints(u.usuario_id, match.id), match.status)" class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide" :class="getTagConfig(getPoints(u.usuario_id, match.id), match.status)!.cls">
                    {{ getTagConfig(getPoints(u.usuario_id, match.id), match.status)!.label }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>

          <!-- Footer: SOMA -->
          <tfoot class="sticky bottom-0 z-20">
            <tr class="border-t-2 border-brand-500/20 bg-brand-500/5 backdrop-blur-md">
              <td class="sticky left-0 z-10 bg-[#fbfbfb] dark:bg-pitch-900 px-3 sm:px-5 py-4 font-bebas text-lg sm:text-xl text-brand-600 dark:text-brand-400 tracking-widest uppercase w-32 sm:w-40">
                <span class="text-[9px] font-sans font-black text-brand-600/50 dark:text-white/20 block leading-none mb-0.5">Total</span>
                SOMA
              </td>
              <td class="sticky left-32 sm:left-40 z-10 bg-[#fbfbfb] dark:bg-pitch-900 shadow-[4px_0_12px_rgba(0,0,0,0.5)] border-r border-white/5"></td>
              <td 
                v-for="u in activeUsers" 
                :key="u.usuario_id"
                class="px-3 py-4 text-center font-bebas text-2xl text-brand-600 dark:text-brand-400"
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
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
