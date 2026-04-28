<script setup lang="ts">
import BaseButton from '../ui/BaseButton.vue'

interface Props {
  isSaving: boolean
  isLocked: boolean
}

defineProps<Props>()
defineEmits(['save'])
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 p-6 bg-pitch-950/80 backdrop-blur-xl border-t border-white/10 flex justify-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
    <div class="w-full max-w-sm">
      <BaseButton
        variant="brand"
        size="lg"
        block
        :disabled="isSaving || isLocked"
        @click="$emit('save')"
      >
        <template v-if="isSaving">
          <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          Salvando...
        </template>
        <template v-else-if="isLocked">
           <span>🔒 Prazo Encerrado</span>
        </template>
        <template v-else>
          <span>🎯 Salvar Palpites</span>
        </template>
      </BaseButton>
    </div>
  </div>
</template>
