<script setup lang="ts">
import BaseButton from '../ui/BaseButton.vue'
import BaseBadge from '../ui/BaseBadge.vue'

interface Match {
  id: string
  time_casa: string
  time_fora: string
  data_partida: string
  is_mandatory: boolean
  is_extra: boolean
}

interface Bet {
  id: string | null
  gols_casa_bet: number
  gols_fora_bet: number
}

const props = defineProps<{
  match: Match
  modelValue: Bet
  shieldHome?: string
  shieldAway?: string
  isLocked: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const updateModel = (field: keyof Bet, value: any) => {
  const newVal = { ...props.modelValue, [field]: value }
  emit('update:modelValue', newVal)
}

const handleIncrement = (field: 'gols_casa_bet' | 'gols_fora_bet') => {
  if (props.isLocked) return
  const current = props.modelValue[field]
  if (current < 20) updateModel(field, current + 1)
}

const handleDecrement = (field: 'gols_casa_bet' | 'gols_fora_bet') => {
  if (props.isLocked) return
  const current = props.modelValue[field]
  if (current > 0) updateModel(field, current - 1)
}

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleString('pt-BR', { 
    weekday: 'short', 
    day: '2-digit', 
    month: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  }).replace(',', ' -')
}
</script>

<template>
  <div 
    class="p-5 sm:p-6 relative transition-all duration-300 group hover:bg-white/[0.02]"
    :class="[
      match.is_mandatory ? 'border-l-4 border-l-brand-500 bg-gradient-to-r from-brand-500/[0.05] to-transparent' : 
      match.is_extra ? 'border-l-4 border-l-pitch-500 bg-gradient-to-r from-pitch-500/[0.05] to-transparent' : 
      'border-l-4 border-l-transparent'
    ]"
  >
    <!-- Card Header (Date & Type Badge) -->
    <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest pb-4 border-b border-white/5 mb-6">
      <span class="text-gray-400 font-mono flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-brand-500/40" />
        {{ formatDate(match.data_partida) }}
      </span>
      <div class="flex gap-2">
         <BaseBadge v-if="match.is_mandatory" variant="brand">Obrigatório</BaseBadge>
         <BaseBadge v-if="match.is_extra" variant="pitch">Extra</BaseBadge>
      </div>
    </div>

    <!-- Match Content (Teams and Inputs) -->
    <div class="flex items-center justify-between gap-2 sm:gap-6">
      <!-- Home Team -->
      <div class="flex flex-col items-center flex-1 w-24 sm:w-32 group-hover:scale-105 transition-transform duration-500">
        <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 mb-3 shadow-lg group-hover:border-brand-500/30 transition-all">
          <img v-if="shieldHome" :src="shieldHome" class="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
          <span v-else class="text-2xl font-bebas text-gray-700">{{ match.time_casa.charAt(0) }}</span>
        </div>
        <span class="font-bebas text-sm sm:text-base text-white text-center tracking-wider px-1">{{ match.time_casa }}</span>
      </div>
      
      <!-- Prediction Area -->
      <div class="flex items-center gap-2 sm:gap-4 p-2 bg-black/40 rounded-[2.5rem] border border-white/10 shadow-inner">
        <!-- Home Score Control -->
        <div class="flex flex-col items-center">
          <button @click="handleIncrement('gols_casa_bet')" :disabled="isLocked" class="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all flex items-center justify-center text-lg disabled:opacity-20">+</button>
          <input 
            type="number" min="0" max="20"
            :value="modelValue.gols_casa_bet"
            :disabled="isLocked"
            @input="updateModel('gols_casa_bet', ($event.target as HTMLInputElement).valueAsNumber)"
            class="w-10 h-12 sm:w-12 sm:h-14 bg-transparent text-center font-bebas text-3xl sm:text-4xl text-white outline-none focus:text-brand-400 disabled:opacity-50 hide-arrows" 
          />
          <button @click="handleDecrement('gols_casa_bet')" :disabled="isLocked" class="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all flex items-center justify-center text-lg disabled:opacity-20">-</button>
        </div>

        <div class="text-brand-500 font-bebas text-2xl flex flex-col items-center justify-center h-full pt-1">
          <span class="opacity-50 text-xs tracking-widest leading-none mb-1 select-none">X</span>
          <div class="w-px h-8 bg-white/10 rounded-full" />
        </div>

        <!-- Away Score Control -->
        <div class="flex flex-col items-center">
          <button @click="handleIncrement('gols_fora_bet')" :disabled="isLocked" class="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all flex items-center justify-center text-lg disabled:opacity-20">+</button>
          <input 
            type="number" min="0" max="20"
            :value="modelValue.gols_fora_bet"
            :disabled="isLocked"
            @input="updateModel('gols_fora_bet', ($event.target as HTMLInputElement).valueAsNumber)"
            class="w-10 h-12 sm:w-12 sm:h-14 bg-transparent text-center font-bebas text-3xl sm:text-4xl text-white outline-none focus:text-brand-400 disabled:opacity-50 hide-arrows" 
          />
          <button @click="handleDecrement('gols_fora_bet')" :disabled="isLocked" class="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all flex items-center justify-center text-lg disabled:opacity-20">-</button>
        </div>
      </div>

      <!-- Away Team -->
      <div class="flex flex-col items-center flex-1 w-24 sm:w-32 group-hover:scale-105 transition-transform duration-500">
        <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 mb-3 shadow-lg group-hover:border-brand-500/30 transition-all">
          <img v-if="shieldAway" :src="shieldAway" class="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
          <span v-else class="text-2xl font-bebas text-gray-700">{{ match.time_fora.charAt(0) }}</span>
        </div>
        <span class="font-bebas text-sm sm:text-base text-white text-center tracking-wider px-1">{{ match.time_fora }}</span>
      </div>
    </div>

    <!-- Feedback de salvo -->
    <div v-if="modelValue.id" class="absolute bottom-4 right-6 flex items-center gap-2 transition-all animate-fade-in">
       <div class="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center shadow-[0_0_10px_rgba(14,165,233,0.5)]">
         <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
       </div>
       <span class="text-[9px] text-brand-400 font-bold uppercase tracking-widest opacity-80">Salvo</span>
    </div>
  </div>
</template>

<style scoped>
/* Remover setinhas numéricas */
.hide-arrows::-webkit-inner-spin-button, .hide-arrows::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.hide-arrows { -moz-appearance: textfield; appearance: textfield; }
</style>
