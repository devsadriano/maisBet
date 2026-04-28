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
  <div class="flex flex-col md:flex-row items-center gap-6 justify-between bg-white/5 border border-white/10 p-6 rounded-[2rem] animate-fade-in-up">
    <!-- Round Selector -->
    <div class="flex items-center gap-4 w-full md:w-auto">
      <div class="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div class="flex-1">
        <label class="text-[10px] font-black uppercase tracking-widest text-brand-400 block mb-1">Selecione a Rodada</label>
        <select 
          :value="modelValue" 
          class="bg-transparent border-none text-xl font-bebas text-white focus:ring-0 p-0 cursor-pointer hover:text-brand-400 transition-colors capitalize"
          @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="r in rounds" :key="r.id" :value="r.id" class="bg-pitch-800 text-white">
            {{ r.numero_rodada }}ª RODADA
          </option>
        </select>
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
