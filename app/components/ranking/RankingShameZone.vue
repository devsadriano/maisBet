<script setup lang="ts">
interface UserRanking {
  usuario_id: string
  nome: string
  time_nome?: string
  escudo_url?: string
  total_pontos: number
  position: number
}

const props = defineProps<{
  entries: UserRanking[]
}>()

const bottomTwo = computed(() => {
  if (props.entries.length < 3) return []
  const sorted = [...props.entries].sort((a, b) => a.position - b.position)
  return sorted.slice(-2).reverse() // [último, penúltimo]
})

const mestreBrasa = computed(() => bottomTwo.value[0])
const auxiliar = computed(() => bottomTwo.value[1])
</script>

<template>
  <section v-if="bottomTwo.length === 2" class="animate-fade-in-up mt-12">
    <div class="relative overflow-hidden rounded-[2rem] border-2 border-red-500/20 dark:border-red-500/15 bg-gradient-to-br from-red-500/[0.07] via-red-500/[0.03] to-orange-500/[0.05] dark:from-red-500/[0.08] dark:via-red-500/[0.03] dark:to-orange-500/[0.05] shadow-2xl">
      
      <!-- Glow Effects -->
      <div class="absolute -top-20 -left-20 w-60 h-60 bg-red-500/10 rounded-full blur-[80px] animate-pulse" />
      <div class="absolute -bottom-20 -right-20 w-60 h-60 bg-orange-500/10 rounded-full blur-[80px]" />

      <!-- Header -->
      <div class="relative z-10 text-center pt-10 pb-6 px-6">
        <span class="text-5xl block mb-4 drop-shadow-lg">🔥</span>
        <h2 class="text-4xl md:text-5xl font-bebas text-red-600 dark:text-red-400 tracking-[0.15em] uppercase leading-none mb-3">
          Escalados pra Brasa
        </h2>
        <p class="text-sm text-red-800/70 dark:text-red-300/60 max-w-lg mx-auto leading-relaxed italic">
          Já podem ir treinando… a carne do churrasco de premiação não vai se assar sozinha!
        </p>
      </div>

      <!-- Cards Grid: 2 columns -->
      <div class="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-8 px-8 pb-10 max-w-2xl mx-auto">

        <!-- Auxiliar de Churrasco (Penúltimo) -->
        <div v-if="auxiliar" class="group flex flex-col items-center space-y-4 cursor-default">
          <div class="relative">
            <!-- Orange Glow -->
            <div class="absolute inset-0 bg-orange-500/20 blur-[40px] rounded-full scale-150 group-hover:scale-[2] transition-transform duration-700" />
            <div class="relative w-28 h-28 rounded-full border-4 border-orange-500/40 overflow-hidden shadow-[0_0_30px_rgba(249,115,22,0.2)] bg-gray-100 dark:bg-pitch-800 transition-transform group-hover:-translate-y-2 duration-500">
              <img v-if="auxiliar.escudo_url" :src="auxiliar.escudo_url" class="absolute inset-0 w-full h-full object-contain p-5 opacity-15" alt="" />
              <div class="absolute inset-0 flex items-center justify-center font-bebas text-5xl text-orange-500 drop-shadow-lg">
                {{ auxiliar.nome.charAt(0) }}
              </div>
            </div>
            <!-- Position badge -->
            <div class="absolute -bottom-1 -right-1 w-9 h-9 bg-orange-500 border-3 border-white dark:border-pitch-900 rounded-full flex items-center justify-center font-bebas text-lg text-white shadow-xl">
              {{ auxiliar.position }}º
            </div>
          </div>
          <div class="text-center">
            <h3 class="text-gray-900 dark:text-white font-bold text-lg">{{ auxiliar.nome }}</h3>
            <p class="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest">{{ auxiliar.time_nome || 'Sem Time' }}</p>
          </div>
          <div class="bg-orange-500/10 border border-orange-500/20 px-5 py-2.5 rounded-2xl text-center">
            <span class="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 block mb-0.5">🧯 Auxiliar de Churrasco</span>
            <span class="font-bebas text-xl text-orange-500">{{ auxiliar.total_pontos }} <span class="text-xs text-orange-600/50 dark:text-orange-400/50">pts</span></span>
          </div>
        </div>

        <!-- Mestre da Brasa (Último) -->
        <div v-if="mestreBrasa" class="group flex flex-col items-center space-y-4 cursor-default">
          <div class="relative">
            <!-- Red Pulsing Glow -->
            <div class="absolute inset-0 bg-red-500/25 blur-[40px] rounded-full scale-150 animate-pulse group-hover:scale-[2] transition-transform duration-700" />
            <div class="relative w-28 h-28 rounded-full border-4 border-red-500/50 overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.3)] bg-gray-100 dark:bg-pitch-800 transition-transform group-hover:-translate-y-2 duration-500">
              <img v-if="mestreBrasa.escudo_url" :src="mestreBrasa.escudo_url" class="absolute inset-0 w-full h-full object-contain p-5 opacity-15" alt="" />
              <div class="absolute inset-0 flex items-center justify-center font-bebas text-5xl text-red-500 drop-shadow-lg">
                {{ mestreBrasa.nome.charAt(0) }}
              </div>
            </div>
            <!-- Position badge -->
            <div class="absolute -bottom-1 -right-1 w-9 h-9 bg-red-600 border-3 border-white dark:border-pitch-900 rounded-full flex items-center justify-center font-bebas text-lg text-white shadow-xl animate-bounce">
              {{ mestreBrasa.position }}º
            </div>
          </div>
          <div class="text-center">
            <h3 class="text-gray-900 dark:text-white font-bold text-lg">{{ mestreBrasa.nome }}</h3>
            <p class="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest">{{ mestreBrasa.time_nome || 'Sem Time' }}</p>
          </div>
          <div class="bg-red-500/10 border border-red-500/20 px-5 py-2.5 rounded-2xl text-center">
            <span class="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 block mb-0.5">🥩 Mestre da Brasa</span>
            <span class="font-bebas text-xl text-red-500">{{ mestreBrasa.total_pontos }} <span class="text-xs text-red-600/50 dark:text-red-400/50">pts</span></span>
          </div>
        </div>

      </div>

      <!-- Footer tagline -->
      <div class="relative z-10 text-center pb-8 px-6">
        <p class="text-[10px] text-red-800/40 dark:text-white/15 uppercase tracking-[0.3em] font-bold">
           Separe o carvão e coloque o avental
        </p>
      </div>
    </div>
  </section>
</template>
