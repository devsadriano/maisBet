<template>
  <Teleport to="body">
    <div
      id="toast-container"
      class="fixed top-6 right-4 z-[9999] flex flex-col gap-3 items-end pointer-events-none"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md min-w-[280px] max-w-sm cursor-pointer"
          :class="variants[toast.type]"
          @click="dismiss(toast.id)"
        >
          <!-- Icon -->
          <span class="text-lg flex-shrink-0 mt-0.5">{{ icons[toast.type] }}</span>

          <!-- Message -->
          <p class="text-sm font-medium leading-snug flex-1">{{ toast.message }}</p>

          <!-- Close hint -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 flex-shrink-0 mt-0.5 opacity-50 hover:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const { toasts, dismiss } = useToast()

const variants: Record<string, string> = {
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  error:   'bg-red-500/10 border-red-500/30 text-red-300',
  info:    'bg-brand-500/10 border-brand-500/30 text-brand-300',
}

const icons: Record<string, string> = {
  success: '✅',
  error:   '❌',
  info:    '💡',
}
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.25s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.9);
}
</style>
