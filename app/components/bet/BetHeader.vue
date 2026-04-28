<script setup lang="ts">
import BaseBadge from '../ui/BaseBadge.vue'

interface Props {
  roundNumber: number
  timeRemaining: string
  isLocked: boolean
}

defineProps<Props>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-6 animate-fade-in-up">
    <!-- Round Title -->
    <div>
      <div class="flex items-center gap-2 mb-2">
        <BaseBadge variant="pitch" pulse v-if="!isLocked">Palpites Liberados</BaseBadge>
        <BaseBadge variant="danger" v-else>Rodada Encerrada</BaseBadge>
      </div>
      <h1 class="text-4xl md:text-5xl font-bebas tracking-tighter text-white">RODADA {{ roundNumber }}</h1>
    </div>
    
    <!-- Countdown Timer Display -->
    <div class="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl backdrop-blur-md">
      <div class="flex flex-col">
        <span class="text-[9px] uppercase font-black text-gray-400 tracking-[0.2em] mb-0.5">Fecha em:</span>
        <span 
          class="font-mono font-bold text-xl tracking-tighter" 
          :class="isLocked || timeRemaining.includes('h 0m') ? 'text-danger-400' : 'text-brand-400'"
        >
          {{ timeRemaining }}
        </span>
      </div>
      <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
        ⌛
      </div>
    </div>
  </div>
</template>
