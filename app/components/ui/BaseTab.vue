<template>
  <div class="flex p-1 bg-white/5 rounded-2xl border border-white/10 shrink-0 self-start md:self-end">
    <button 
      v-for="option in options" 
      :key="option.id"
      @click="$emit('update:modelValue', option.id)"
      class="px-6 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300"
      :class="modelValue === option.id ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Option {
  id: string
  label: string
}

interface Props {
  modelValue: string
  options: Option[]
}

defineProps<Props>()
defineEmits(['update:modelValue'])
</script>
