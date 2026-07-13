<script setup lang="ts">
import { computed } from 'vue'

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

interface RoundEntry {
  usuario_id: string
  nome: string
  total_pontos: number
}

const props = defineProps<{
  matches: Match[]
  loading: boolean
  roundRanking?: RoundEntry[]
}>()

const abbrev = (name: string) =>
  name.replace(/^(S\.C\.|S\.E\.|Atlético|Sport Club|Esporte Clube|Clube de Regatas|Clube|Associação|Sociedade)\s*/i, '')
     .trim()
     .substring(0, 15)

// Top 3 da rodada ordenado por pontuação
const topRound = computed(() =>
  [...(props.roundRanking || [])]
    .sort((a, b) => b.total_pontos - a.total_pontos)
    .slice(0, 3)
    .filter(e => e.total_pontos > 0)
)
</script>

<template>
  <!-- sticky: o card acompanha o scroll da tabela ao lado -->
  <div class="bg-white/[0.04] border border-white/10 rounded-3xl overflow-hidden shadow-2xl sticky top-[5.5rem] self-start">
    <!-- Header -->
    <div class="bg-gradient-to-r from-brand-600 to-brand-500 py-4 px-4 sm:px-6 flex items-center justify-between">
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
        class="px-3 sm:px-5 py-3.5 sm:py-4 group hover:bg-white/[0.04] transition-all duration-200"
      >
        <div class="flex items-center gap-1.5 sm:gap-3">
          <!-- Home Team -->
          <div class="flex-1 flex items-center justify-end gap-1.5 sm:gap-2 min-w-0">
            <span class="text-xs sm:text-sm font-bold text-gray-800 dark:text-white/90 group-hover:text-gray-900 dark:group-hover:text-white transition-colors text-right leading-tight truncate">
              {{ abbrev(match.time_casa) }}
            </span>
          </div>

          <!-- Score Box -->
          <div class="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <div class="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center rounded-xl font-bebas text-xl sm:text-2xl leading-none pt-0.5 sm:pt-1 animate-fade-in"
                 :class="match.status === 'finalizado' ? 'bg-brand-500/20 border border-brand-500/40 text-brand-600 dark:text-brand-300' : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/15 text-gray-500 dark:text-white/50'">
              {{ match.gols_casa ?? '-' }}
            </div>
            <span class="text-[9px] sm:text-[10px] font-black text-gray-500 px-0.5 sm:px-1">×</span>
            <div class="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center rounded-xl font-bebas text-xl sm:text-2xl leading-none pt-0.5 sm:pt-1 animate-fade-in"
                 :class="match.status === 'finalizado' ? 'bg-brand-500/20 border border-brand-500/40 text-brand-600 dark:text-brand-300' : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/15 text-gray-500 dark:text-white/50'">
              {{ match.gols_fora ?? '-' }}
            </div>
          </div>

          <!-- Away Team -->
          <div class="flex-1 flex items-center justify-start gap-1.5 sm:gap-2 min-w-0">
            <span class="text-xs sm:text-sm font-bold text-gray-800 dark:text-white/90 group-hover:text-gray-900 dark:group-hover:text-white transition-colors leading-tight truncate">
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

    <!-- ══════════════════════════════════════════ -->
    <!-- 🏆 Mini Ranking da Rodada                 -->
    <!-- Preenche o espaço abaixo dos jogos        -->
    <!-- ══════════════════════════════════════════ -->
    <div v-if="topRound.length > 0" class="border-t border-white/10">
      <!-- Cabeçalho da seção -->
      <div class="px-4 sm:px-5 pt-4 pb-1 flex items-center gap-2">
        <div class="flex-1 h-px bg-gradient-to-r from-brand-500/40 to-transparent" />
        <span class="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">Top da Rodada</span>
        <div class="flex-1 h-px bg-gradient-to-l from-brand-500/40 to-transparent" />
      </div>

      <div class="px-3 sm:px-4 pb-4 pt-2 space-y-1.5">
        <div
          v-for="(entry, i) in topRound"
          :key="entry.usuario_id"
          class="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200"
          :class="[
            i === 0 ? 'bg-yellow-500/8 border border-yellow-500/15 hover:bg-yellow-500/12' :
            i === 1 ? 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.05]' :
                      'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]'
          ]"
        >
          <!-- Posição -->
          <div
            class="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 leading-none"
            :class="[
              i === 0 ? 'bg-yellow-500/25 text-yellow-400' :
              i === 1 ? 'bg-gray-400/20 text-gray-300' :
                        'bg-orange-500/15 text-orange-400'
            ]"
          >
            {{ i + 1 }}
          </div>

          <!-- Avatar inicial -->
          <div class="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bebas shrink-0"
            :class="i === 0 ? 'text-yellow-300/70' : 'text-white/40'">
            {{ entry.nome.charAt(0).toUpperCase() }}
          </div>

          <!-- Nome -->
          <span
            class="flex-1 text-xs font-semibold truncate"
            :class="i === 0 ? 'text-yellow-100/80' : 'text-white/60'"
          >
            {{ entry.nome.split(' ')[0] }}
          </span>

          <!-- Pontos -->
          <div class="flex items-baseline gap-0.5 shrink-0">
            <span
              class="font-bebas text-lg leading-none"
              :class="i === 0 ? 'text-yellow-400' : 'text-brand-400'"
            >{{ entry.total_pontos }}</span>
            <span class="text-[9px] font-bold text-white/20 uppercase">pts</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vazio do mini-ranking (loading ou sem dados) -->
    <div v-else-if="!loading && matches.length > 0" class="border-t border-white/5 px-5 py-5 text-center">
      <p class="text-[10px] font-bold text-white/20 uppercase tracking-widest">Sem pontuações ainda</p>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
