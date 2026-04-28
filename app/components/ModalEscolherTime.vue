<template>
  <!-- Overlay -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        @click.self="canClose ? $emit('close') : null"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

        <!-- Modal Card -->
        <div class="relative z-10 w-full max-w-2xl bg-pitch-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <!-- Header -->
          <div class="px-6 py-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bebas tracking-widest text-white">Escolha seu Time</h2>
              <p class="text-gray-400 text-sm mt-0.5" v-if="canClose">Seu time do coração para o bolão. Pode mudar depois.</p>
              <p class="text-brand-400 text-xs mt-0.5" v-else>Atenção: A escolha é definitiva e não poderá ser alterada depois!</p>
            </div>
            <button v-if="canClose" @click="$emit('close')" class="text-gray-500 hover:text-white transition-colors p-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="p-12 flex justify-center">
            <div class="w-10 h-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
          </div>

          <!-- Grid de Times -->
          <div v-else class="p-4 max-h-[60vh] overflow-y-auto">
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              <button
                v-for="time in times"
                :key="time.id"
                @click="selecionar(time)"
                :disabled="salvando"
                :class="[
                  'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all group',
                  selectedId === time.id
                    ? 'border-brand-500 bg-brand-500/20 shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                ]"
              >
                <!-- Escudo ou Iniciais -->
                <img
                  v-if="time.escudo_url"
                  :src="time.escudo_url"
                  :alt="time.nome"
                  class="w-14 h-14 object-contain drop-shadow-md"
                />
                <div v-else class="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 border border-white/10">
                  <span class="text-sm font-bold text-gray-400 font-bebas tracking-wider">
                    {{ initials(time.nome) }}
                  </span>
                </div>
                <span class="text-xs text-center text-gray-300 group-hover:text-white transition-colors leading-tight">{{ time.nome }}</span>
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
            <button v-if="canClose" @click="$emit('close')" class="px-5 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button
              @click="confirmar"
              :disabled="!selectedId || salvando"
              class="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              <span v-if="salvando" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ salvando ? 'Salvando...' : 'Confirmar Time' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Time } from '~~/shared/types/Time'

const props = withDefaults(defineProps<{ open: boolean, currentTimeId?: string | null, canClose?: boolean }>(), {
  canClose: true
})
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved', time: Time): void }>()

const { times, loading, fetchTimes, escolherTime } = useTeams()
const { user, profile } = useAuth()
const { currentAcesso } = useCampeonato()

const selectedId = ref<string | null>(props.currentTimeId ?? null)
const salvando = ref(false)

// Inicia ao abrir
watch(() => props.open, (val) => {
  if (val) {
    selectedId.value = props.currentTimeId ?? null
    fetchTimes(currentAcesso.value?.campeonato_id || undefined)
  }
})

const selecionar = (time: Time) => {
  selectedId.value = time.id
}

const initials = (nome: string) => {
  return nome.split(' ').map(w => w[0]).slice(0, 3).join('').toUpperCase()
}

const confirmar = async () => {
  if (!selectedId.value || !currentAcesso.value?.id) {
    console.warn('[ModalEscolherTime] Abortado: selectedId ou currentAcesso.id ausente', {
      selectedId: selectedId.value,
      acessoId: currentAcesso.value?.id
    })
    return
  }
  salvando.value = true
  try {
    await escolherTime(selectedId.value, currentAcesso.value.id)
    const timeSelecionado = times.value.find(t => t.id === selectedId.value)!
    
    // Atualiza o acesso local imediatamente
    const updatedAcesso = { 
       ...currentAcesso.value, 
       time_id: selectedId.value, 
       times: timeSelecionado 
    };
    currentAcesso.value = updatedAcesso;
    
    // Atualiza também dentro da array global 'campeonatos' para não perder estado ao navegar
    const { campeonatos, fetchCampeonatos } = useCampeonato();
    const targetCamp = campeonatos.value.find(c => c.id === currentAcesso.value.campeonato_id);
    if (targetCamp) {
       // @ts-ignore
       targetCamp.user_acesso = updatedAcesso;
    }
    
    // Força re-busca do banco para garantir persistência real
    await fetchCampeonatos(true)
    
    emit('saved', timeSelecionado)
    emit('close')
  } catch (e: any) {
    console.error('Erro ao salvar time:', e)
  } finally {
    salvando.value = false
  }
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
</style>
