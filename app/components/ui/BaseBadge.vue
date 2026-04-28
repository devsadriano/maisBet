<template>
  <span
    :class="[
      'inline-flex items-center justify-center font-black uppercase tracking-[0.15em] shrink-0 rounded select-none',
      variantClasses[variant],
      sizeClasses[size]
    ]"
  >
    <div v-if="pulse" class="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" :class="dotClasses[variant]" />
    <slot />
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'brand' | 'pitch' | 'danger' | 'gold' | 'gray'
  size?: 'xs' | 'sm' | 'md'
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'brand',
  size: 'xs',
  pulse: false
})

const variantClasses = {
  brand:  'bg-[var(--brand-dim)] text-[var(--brand)] border border-[color:var(--brand)] border-opacity-30',
  pitch:  'bg-pitch-500/10 text-pitch-500 border border-pitch-500/30',
  danger: 'bg-[var(--danger-dim)] text-[var(--danger)] border border-[color:var(--danger)] border-opacity-30 font-bold',
  gold:   'bg-[var(--gold-dim)] text-[var(--gold)] border border-[color:var(--gold)] border-opacity-30',
  gray:   'bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-[var(--border)]'
}

const dotClasses = {
  brand:  'bg-[var(--brand)]',
  pitch:  'bg-pitch-500',
  danger: 'bg-[var(--danger)]',
  gold:   'bg-[var(--gold)]',
  gray:   'bg-[var(--text-muted)]'
}

const sizeClasses = {
  xs: 'px-2 py-0.5 text-[8px]',
  sm: 'px-2.5 py-1 text-[10px]',
  md: 'px-3 py-1.5 text-xs'
}
</script>
