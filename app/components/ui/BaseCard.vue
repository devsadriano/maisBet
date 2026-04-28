<template>
  <div
    :class="[
      'relative backdrop-blur-xl rounded-[2.5rem] border transition-all duration-500',
      variantClasses[variant],
      paddingClasses[padding]
    ]"
  >
    <!-- Glass Highlight -->
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'brand' | 'pitch' | 'danger' | 'glass' | 'gold'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'glass',
  padding: 'md'
})

const variantClasses = {
  // brand: usa --brand token (verde no dark, verde forte no light)
  brand:  'bg-[var(--brand-dim)] border-[color:var(--brand)] border-opacity-20 text-[var(--text-primary)] shadow-[0_30px_80px_-15px_var(--brand-glow)]',
  // pitch: card neutro, adapta ao modo (escuro transparente / light branco)
  pitch:  'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] dark:bg-[rgba(255,255,255,0.04)] dark:border-white/5',
  // danger: vermelho semântico
  danger: 'bg-[var(--danger-dim)] border-[color:var(--danger)] border-opacity-20 text-[var(--text-primary)] shadow-[0_30px_80px_-15px_rgba(239,68,68,0.15)]',
  // glass: overlay sutil
  glass:  'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] dark:bg-[rgba(255,255,255,0.02)] dark:border-white/5',
  // gold: dourado
  gold:   'bg-[var(--gold-dim)] border-[color:var(--gold)] border-opacity-20 text-[var(--text-primary)] shadow-[0_30px_80px_-15px_rgba(234,179,8,0.15)]'
}

const paddingClasses = {
  none: '',
  sm:   'p-4 md:p-6',
  md:   'p-8 md:p-10',
  lg:   'p-12 md:p-20'
}
</script>
