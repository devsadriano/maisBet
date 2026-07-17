<script setup lang="ts">
interface UserRanking {
  usuario_id: string
  nome: string
  time_nome?: string
  escudo_url?: string
  total_pontos: number
}

defineProps<{
  topThree: UserRanking[]
}>()
</script>

<template>
  <section class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-end mb-8 md:mb-16 px-2 sm:px-4 animate-fade-in-up" style="isolation: isolate;">
    <!-- 2nd Place -->
    <div v-if="topThree[1]" class="order-2 md:order-1 group cursor-default">
      <div class="flex flex-col items-center space-y-4 transition-transform group-hover:-translate-y-2 duration-500">
        <div class="relative" style="transform: translateZ(0);">
          <div class="absolute inset-0 bg-gray-400/10 rounded-full scale-150 animate-pulse-glow" style="filter: blur(32px); will-change: box-shadow; transform: translateZ(0);" />
          <div class="relative w-24 h-24 rounded-full border-4 border-gray-400/30 overflow-hidden shadow-2xl bg-pitch-800">
            <img v-if="topThree[1].escudo_url" :src="topThree[1].escudo_url" class="absolute inset-0 w-full h-full object-contain p-4 opacity-10" alt="" />
            <div class="absolute inset-0 flex items-center justify-center font-bebas text-4xl text-gray-400">
              {{ topThree[1].nome.charAt(0) }}
            </div>
          </div>
          <div class="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-400 border-2 border-pitch-900 rounded-full flex items-center justify-center font-bebas text-pitch-900 shadow-xl">
            2
          </div>
        </div>
        <div class="text-center">
          <h3 class="text-gray-900 dark:text-white font-bold truncate max-w-[150px]">{{ topThree[1].nome }}</h3>
          <p class="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest">{{ topThree[1].time_nome || 'Sem Time' }}</p>
        </div>
        <div class="bg-gray-400/10 dark:bg-gray-400/5 border border-gray-400/20 dark:border-gray-400/10 px-6 py-3 rounded-2xl w-full text-center">
          <span class="block text-2xl font-bebas text-gray-700 dark:text-gray-200">{{ topThree[1].total_pontos }} <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">pts</span></span>
        </div>
      </div>
    </div>

    <!-- 1st Place -->
    <div v-if="topThree[0]" class="order-1 md:order-2 group cursor-default">
      <div class="flex flex-col items-center space-y-6 transition-transform group-hover:-translate-y-4 duration-500">
        <div class="relative" style="transform: translateZ(0);">
          <div class="absolute inset-0 bg-brand-500/20 rounded-full scale-150 animate-pulse-glow" style="filter: blur(50px); will-change: box-shadow; transform: translateZ(0);" />
          <div class="relative w-32 h-32 rounded-full border-4 border-brand-500 overflow-hidden shadow-[0_0_40px_rgba(14,165,233,0.3)] bg-pitch-800 scale-110">
            <img v-if="topThree[0].escudo_url" :src="topThree[0].escudo_url" class="absolute inset-0 w-full h-full object-contain p-4 opacity-15" alt="" />
            <div class="absolute inset-0 flex items-center justify-center font-bebas text-6xl text-brand-500 drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]">
              {{ topThree[0].nome.charAt(0) }}
            </div>
          </div>
          <div class="absolute -bottom-1 -right-1 w-12 h-12 bg-brand-500 border-4 border-pitch-900 rounded-full flex items-center justify-center font-bebas text-2xl text-white shadow-2xl animate-bounce">
            1
          </div>
        </div>
        <div class="text-center">
          <h3 class="text-gray-900 dark:text-white text-xl font-bebas tracking-widest">{{ topThree[0].nome }}</h3>
          <p class="text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-widest">{{ topThree[0].time_nome || 'Sem Time' }}</p>
        </div>
        <div class="bg-brand-500/10 border border-brand-500/30 dark:border-brand-500/20 px-8 py-5 rounded-[2rem] w-full text-center relative overflow-hidden">
          <span class="block text-5xl font-bebas text-brand-600 dark:text-brand-400 relative z-10">{{ topThree[0].total_pontos }} <span class="text-xl">PTS</span></span>
        </div>
      </div>
    </div>

    <!-- 3rd Place -->
    <div v-if="topThree[2]" class="order-3 group cursor-default">
      <div class="flex flex-col items-center space-y-4 transition-transform group-hover:-translate-y-2 duration-500">
        <div class="relative" style="transform: translateZ(0);">
          <div class="absolute inset-0 bg-orange-600/10 rounded-full scale-150" style="filter: blur(32px); will-change: transform; transform: translateZ(0);" />
          <div class="relative w-24 h-24 rounded-full border-4 border-orange-800/30 overflow-hidden shadow-2xl bg-pitch-800">
            <img v-if="topThree[2].escudo_url" :src="topThree[2].escudo_url" class="absolute inset-0 w-full h-full object-contain p-4 opacity-10" alt="" />
            <div class="absolute inset-0 flex items-center justify-center font-bebas text-4xl text-orange-600/80">
              {{ topThree[2].nome.charAt(0) }}
            </div>
          </div>
          <div class="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-800 border-2 border-pitch-900 rounded-full flex items-center justify-center font-bebas text-white shadow-xl">
            3
          </div>
        </div>
        <div class="text-center">
          <h3 class="text-gray-900 dark:text-white font-bold truncate max-w-[150px]">{{ topThree[2].nome }}</h3>
          <p class="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest">{{ topThree[2].time_nome || 'Sem Time' }}</p>
        </div>
        <div class="bg-orange-800/10 border border-orange-800/20 dark:border-orange-800/10 px-6 py-3 rounded-2xl w-full text-center">
          <span class="block text-2xl font-bebas text-orange-600 dark:text-orange-500/80">{{ topThree[2].total_pontos }} <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">pts</span></span>
        </div>
      </div>
    </div>
  </section>
</template>
