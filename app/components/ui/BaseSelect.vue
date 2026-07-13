<script setup lang="ts">
import { ref, computed } from 'vue'

interface Option {
  value: any
  label: string
}

const props = withDefaults(defineProps<{
  modelValue: any
  options: (Option | string)[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  variant?: 'brand' | 'danger' | 'amber' | 'default'
  triggerClass?: string
}>(), {
  placeholder: 'Selecione...',
  disabled: false,
  required: false,
  variant: 'brand',
  triggerClass: 'w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl cursor-pointer select-none transition-all duration-200'
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)

const normalizedOptions = computed<Option[]>(() => {
  return props.options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt }
    }
    return opt
  })
})

const selectedOption = computed(() => {
  return normalizedOptions.value.find(opt => opt.value === props.modelValue)
})

const displayLabel = computed(() => {
  return selectedOption.value ? selectedOption.value.label : props.placeholder
})

const selectOption = (val: any) => {
  if (props.disabled) return
  emit('update:modelValue', val)
  emit('change', val)
  isOpen.value = false
}

// Colors based on variant
const borderClass = computed(() => {
  if (props.variant === 'danger') return 'focus-within:border-red-500/50 hover:border-white/20'
  if (props.variant === 'amber') return 'focus-within:border-amber-500/50 hover:border-white/20'
  return 'focus-within:border-brand-500/50 hover:border-white/20'
})

const activeTextClass = computed(() => {
  if (props.variant === 'danger') return 'text-red-500 dark:text-red-400 bg-red-500/10'
  if (props.variant === 'amber') return 'text-amber-500 dark:text-amber-400 bg-amber-500/10'
  return 'text-brand-500 dark:text-brand-400 bg-brand-500/10'
})

const hoverClass = computed(() => {
  if (props.variant === 'danger') return 'hover:bg-red-500/5 hover:text-red-400 dark:hover:bg-white/[0.05] dark:hover:text-white'
  if (props.variant === 'amber') return 'hover:bg-amber-500/5 hover:text-amber-400 dark:hover:bg-white/[0.05] dark:hover:text-white'
  return 'hover:bg-brand-500/5 hover:text-brand-600 dark:hover:bg-white/[0.05] dark:hover:text-white'
})

const arrowColorClass = computed(() => {
  if (props.variant === 'danger') return 'text-red-500'
  if (props.variant === 'amber') return 'text-amber-500'
  return 'text-brand-500'
})
</script>

<template>
  <div class="relative inline-block min-w-0 w-full">
    <!-- Selector Trigger -->
    <div 
      :class="[
        triggerClass,
        borderClass,
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      ]"
      @click="!disabled && (isOpen = !isOpen)"
    >
      <span class="text-xs font-bold text-white truncate max-w-[280px] sm:max-w-xs leading-none">
        {{ displayLabel }}
      </span>
      <div 
        class="transition-transform duration-200 shrink-0"
        :class="[
          isOpen ? 'rotate-180' : '',
          arrowColorClass
        ]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- Backdrop to close dropdown -->
    <div v-if="isOpen" class="fixed inset-0 z-40 cursor-default" @click.stop="isOpen = false" />

    <!-- Dropdown Menu -->
    <div 
      v-if="isOpen" 
      class="absolute left-0 top-full mt-2 w-full min-w-[200px] max-h-60 overflow-y-auto theme-surface-2 border border-white/10 rounded-xl shadow-2xl z-50 py-1.5 custom-scrollbar animate-fade-in"
    >
      <button 
        v-for="opt in normalizedOptions" 
        :key="opt.value"
        type="button"
        class="w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between truncate"
        :class="opt.value === modelValue ? activeTextClass : ['text-gray-600 dark:text-gray-300', hoverClass]"
        @click.stop="selectOption(opt.value)"
      >
        <span class="truncate pr-2">{{ opt.label }}</span>
        <svg v-if="opt.value === modelValue" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.22);
}
</style>
