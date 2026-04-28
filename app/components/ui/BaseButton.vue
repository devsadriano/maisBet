<template>
  <button
    :class="[
      'font-bebas tracking-[0.2em] relative overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group',
      variantClasses[variant],
      sizeClasses[size],
      { 'w-full': block }
    ]"
    v-bind="$attrs"
  >
    <!-- Background layer for glow/hover effects -->
    <div class="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
    
    <!-- Content Slot -->
    <span class="relative z-10 flex items-center justify-center gap-2">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'brand' | 'pitch' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'brand',
  size: 'md',
  block: false
})

const variantClasses = {
  brand:   'bg-[var(--brand)] text-black dark:text-black shadow-[0_0_20px_var(--brand-glow)] hover:shadow-[0_0_30px_var(--brand-glow)] border border-[color:var(--brand)] border-opacity-30 rounded-2xl',
  pitch:   'bg-[var(--bg-surface-2)] text-[var(--text-primary)] dark:text-white shadow-[0_0_20px_rgba(20,83,45,0.3)] hover:shadow-[0_0_30px_rgba(20,83,45,0.5)] border border-[var(--border)] rounded-2xl',
  danger:  'bg-[var(--danger)] text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] border border-[color:var(--danger)] border-opacity-30 rounded-2xl',
  outline: 'bg-transparent border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[color:var(--brand)] hover:border-opacity-50 hover:bg-[var(--brand-dim)] rounded-2xl',
  ghost:   'bg-transparent text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--brand-dim)] rounded-2xl'
}

const sizeClasses = {
  sm: 'px-4 py-1.5 text-[10px]',
  md: 'px-6 py-2.5 text-xs',
  lg: 'px-10 py-4 text-sm'
}
</script>
