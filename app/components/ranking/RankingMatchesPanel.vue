<script setup lang="ts">
interface Match {
  id: string
  time_casa: string
  time_fora: string
  gols_casa?: number | null
  gols_fora?: number | null
  status: string
  api_team_home_id?: number | null
  api_team_away_id?: number | null
}

defineProps<{
  matches: Match[]
  loading: boolean
}>()

const abbrev = (name: string) => 
  name.replace(/^(S\.C\.|Atlético|Sport Club|Esporte Clube|Clube de Regatas|Clube)\s*/i, '')
     .trim()
     .substring(0, 14)
</script>

<template>
  <div class="bg-white/[0.04] border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-full">
    <!-- Header -->
    <div class="bg-gradient-to-r from-brand-600 to-brand-500 py-4 px-6 flex items-center justify-between">
      <h3 class="text-white font-bebas tracking-widest text-xl">PLACAR REAL</h3>
      <span class="text-[10px] font-black bg-white/20 text-white px-3 py-1 rounded-full uppercase tracking-widest animate-pulse border border-white/30">
        🔴 LIVE
      </span>
    </div>

    <!-- Match List -->
    <div class="divide-y divide-white/5 overflow-y-auto hide-scrollbar">
      <div v-if="loading" class="py-14 text-center text-gray-500 font-bebas tracking-widest text-lg animate-pulse">
        Carregando Jogos...
      </div>

      <div v-else-if="matches.length === 0" class="py-14 text-center text-gray-500 text-sm italic">
        Nenhuma partida cadastrada nesta rodada.
      </div>

      <div
        v-for="match in matches"
        :key="match.id"
        class="px-5 py-4 group hover:bg-white/[0.04] transition-all duration-200"
      >
        <div class="flex items-center gap-3">
          <!-- Home Team -->
          <div class="flex-1 flex items-center justify-end gap-2 min-w-0">
            <span class="text-sm font-bold text-gray-800 dark:text-white/90 group-hover:text-gray-900 dark:group-hover:text-white transition-colors text-right leading-tight">
              {{ abbrev(match.time_casa) }}
            </span>
          </div>

          <!-- Score Box -->
          <div class="flex items-center gap-1 shrink-0">
            <div class="w-10 h-10 flex items-center justify-center rounded-xl font-bebas text-2xl leading-none pt-1"
                 :class="match.status === 'finalizado' ? 'bg-brand-500/20 border border-brand-500/40 text-brand-600 dark:text-brand-300' : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/15 text-gray-500 dark:text-white/50'">
              {{ match.gols_casa ?? '-' }}
            </div>
            <span class="text-[10px] font-black text-gray-500 px-0.5">×</span>
            <div class="w-10 h-10 flex items-center justify-center rounded-xl font-bebas text-2xl leading-none pt-1"
                 :class="match.status === 'finalizado' ? 'bg-brand-500/20 border border-brand-500/40 text-brand-600 dark:text-brand-300' : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/15 text-gray-500 dark:text-white/50'">
              {{ match.gols_fora ?? '-' }}
            </div>
          </div>

          <!-- Away Team -->
          <div class="flex-1 flex items-center justify-start gap-2 min-w-0">
            <span class="text-sm font-bold text-gray-800 dark:text-white/90 group-hover:text-gray-900 dark:group-hover:text-white transition-colors leading-tight">
              {{ abbrev(match.time_fora) }}
            </span>
          </div>
        </div>

        <!-- Status chip -->
        <div class="text-center mt-1.5">
          <span v-if="match.status === 'finalizado'" class="text-[9px] font-bold text-emerald-600 dark:text-emerald-400/70 uppercase tracking-widest">✓ Encerrado</span>
          <span v-else-if="match.status === 'adiado'" class="text-[9px] font-bold text-yellow-600 dark:text-yellow-400/60 uppercase tracking-widest">Adiado</span>
          <span v-else class="text-[9px] font-bold text-gray-400 dark:text-white/20 uppercase tracking-widest">Aguardando</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
