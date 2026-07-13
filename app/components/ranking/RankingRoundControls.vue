<script setup lang="ts">
import { ref, computed } from 'vue'

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

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)

// Posição calculada no momento da abertura para o dropdown teleportado
const dropdownPos = ref({ top: 0, left: 0, width: 220 })

const selectedRoundLabel = computed(() => {
  const r = props.rounds.find(round => round.id === props.modelValue)
  return r ? `${r.numero_rodada}ª RODADA` : 'Selecione a Rodada'
})

const openDropdown = () => {
  if (triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect()
    dropdownPos.value = {
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 240),
    }
  }
  isOpen.value = true
}

const closeDropdown = () => {
  isOpen.value = false
}

const toggleDropdown = () => {
  isOpen.value ? closeDropdown() : openDropdown()
}

const selectRound = (roundId: string) => {
  emit('update:modelValue', roundId)
  closeDropdown()
}

// Estilo computado para o dropdown teleportado (fixed + posição correta)
const dropdownStyle = computed(() => ({
  position: 'fixed' as const,
  top: `${dropdownPos.value.top}px`,
  left: `${dropdownPos.value.left}px`,
  width: `${dropdownPos.value.width}px`,
  zIndex: 9999,
}))
</script>

<template>
  <div class="flex flex-col md:flex-row items-center md:items-center gap-6 sm:gap-8 justify-between bg-gradient-to-r from-brand-500/10 via-white/5 to-white/5 border border-brand-500/20 p-6 sm:p-8 rounded-[2.5rem] shadow-[0_0_40px_rgba(var(--brand-rgb),0.1)] animate-fade-in-up">

    <!-- Round Selector Trigger -->
    <div
      ref="triggerRef"
      class="flex items-center justify-center md:justify-start gap-5 w-full md:w-auto cursor-pointer hover:bg-white/[0.04] p-3 rounded-2xl transition-all duration-200 border border-transparent hover:border-white/5 select-none group"
      @click="toggleDropdown"
    >
      <!-- Calendar Icon Box -->
      <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-500/40 group-hover:scale-105 transition-transform duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <!-- Label + Selected Round -->
      <div class="flex-1 flex flex-col min-w-0 text-left">
        <label class="text-xs font-black uppercase tracking-[0.2em] text-brand-400 block mb-1 drop-shadow-md cursor-pointer">Selecione a Rodada</label>
        <div class="flex items-center gap-2">
          <span class="text-2xl sm:text-4xl font-bebas text-white group-hover:text-brand-300 transition-colors capitalize leading-none pt-1">
            {{ selectedRoundLabel }}
          </span>
          <div
            class="text-brand-500 group-hover:text-brand-300 transition-all duration-200"
            :class="{ 'rotate-180': isOpen }"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Panel -->
    <div class="flex items-center gap-8 sm:gap-12 w-full md:w-auto justify-center md:justify-end">
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

  <!-- ══════════════════════════════════════════════════════════════ -->
  <!-- Teleport para o body: garante z-index absoluto sobre tudo,   -->
  <!-- escapando qualquer stacking context da página (sticky, etc.) -->
  <!-- ══════════════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <!-- Backdrop (clica fora para fechar) -->
    <div
      v-if="isOpen"
      class="fixed inset-0"
      style="z-index: 9998"
      @click="closeDropdown"
    />

    <!-- Dropdown panel -->
    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-[0.98]"
    >
      <div
        v-if="isOpen"
        class="max-h-72 overflow-y-auto rounded-2xl border py-1.5 shadow-[0_16px_60px_rgba(0,0,0,0.5)] custom-scrollbar
               bg-white border-black/10
               dark:bg-[#1c1c1c] dark:border-white/12"
        :style="dropdownStyle"
      >
        <button
          v-for="r in rounds"
          :key="r.id"
          class="w-full text-left px-4 py-2.5 text-base font-bebas tracking-wider transition-colors flex items-center justify-between"
          :class="r.id === modelValue
            ? 'text-brand-600 dark:text-brand-400 bg-brand-500/10'
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white'"
          @click.stop="selectRound(r.id)"
        >
          <span>{{ r.numero_rodada }}ª RODADA</span>
          <svg v-if="r.id === modelValue" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-brand-500 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.3);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.5);
}
</style>
