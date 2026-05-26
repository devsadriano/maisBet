<script setup lang="ts">
interface Round {
  id: string
  numero_rodada: number
  status: string
}

const props = defineProps<{
  modelValue: string | null
  rounds: Round[]
  averagePoints: number
  roundStatus: string
}>()

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex flex-col md:flex-row items-center gap-6 justify-between bg-gradient-to-r from-brand-500/10 via-white/5 to-white/5 border border-brand-500/20 p-6 rounded-[2rem] shadow-[0_0_40px_rgba(var(--brand-rgb),0.1)] animate-fade-in-up">
    <!-- Round Selector -->
    <div class="flex items-center gap-5 w-full md:w-auto">
      <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-500/40">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div class="flex-1 flex flex-col">
        <label class="text-xs font-black uppercase tracking-[0.2em] text-brand-400 block mb-1 drop-shadow-md">Selecione a Rodada</label>
        <div class="relative group cursor-pointer inline-block">
          <select 
            :value="modelValue" 
            class="bg-transparent border-none text-4xl font-bebas text-white focus:ring-0 p-0 pr-8 cursor-pointer group-hover:text-brand-300 transition-colors capitalize appearance-none outline-none"
            @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="r in rounds" :key="r.id" :value="r.id" class="bg-pitch-800 text-white text-xl">
              {{ r.numero_rodada }}ª RODADA
            </option>
          </select>
          <div class="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-brand-500 group-hover:text-brand-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Panel -->
    <div class="flex items-center gap-8 w-full md:w-auto justify-around md:justify-end">
      <div class="text-center md:text-right">
        <span class="text-gray-400 text-[10px] font-black uppercase tracking-widest block mb-1">Média de Pontos</span>
        <span class="text-2xl font-bebas text-white">{{ averagePoints.toFixed(1) }}</span>
      </div>
      <div class="h-10 w-px bg-white/10" />
      <div class="text-center md:text-right text-brand-500 animate-pulse">
        <span class="text-[10px] font-black uppercase tracking-widest block mb-1">Status</span>
        <span class="text-lg font-bebas uppercase tracking-widest">{{ roundStatus }}</span>
      </div>
    </div>
  </div>
</template>
