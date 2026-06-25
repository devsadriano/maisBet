<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>

        <!-- Modal -->
        <div class="relative z-10 w-full max-w-3xl bg-pitch-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <!-- Header -->
          <div class="px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-gradient-to-r from-orange-500/10 to-transparent">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-orange-500/20 text-orange-400">Organizador</span>
                <span class="text-xs text-gray-400 font-mono">Rodada {{ rodada.numero_rodada }}</span>
                
                <div v-if="orgTimeRemaining" class="flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-black/40 rounded border border-orange-500/30">
                  <span class="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  <span class="text-[10px] font-mono text-orange-400">{{ orgTimeRemaining }}</span>
                </div>
              </div>
              <h2 class="text-2xl font-bebas tracking-widest text-white">Escolha {{ calculatedExtras }} Jogos Especiais</h2>
            </div>
            <button @click="$emit('close')" class="text-gray-500 hover:text-white transition-colors p-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Orientação / Passos -->
          <div class="px-4 sm:px-6 py-3 sm:py-4 bg-white/[0.02] border-b border-white/5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold shrink-0">✓</div>
              <div class="text-sm">
                <p class="font-bold text-white leading-none">Jogos Obrigatórios</p>
                <p class="text-[10px] text-brand-300 uppercase leading-tight">Já definidos pelo sistema</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="hidden sm:block w-5 h-5 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <div :class="['flex items-center gap-2 transition-opacity', extraIds.length === calculatedExtras ? 'opacity-100' : 'opacity-80']">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0', extraIds.length === calculatedExtras ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]']">
                {{ extraIds.length }}/{{ calculatedExtras }}
              </div>
              <div class="text-sm">
                <p class="font-bold text-white leading-none">Jogos Extras</p>
                <p class="text-[10px] text-orange-300 uppercase leading-tight">Escolha {{ calculatedExtras }} p/ abrir rodada</p>
              </div>
            </div>
          </div>

          <!-- Lista de Jogos -->
          <div class="p-3 sm:p-6 overflow-y-auto flex-1">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                v-for="m in partidasOrdenadas"
                :key="m.id"
                @click="selecionar(m.id)"
                :class="[
                  'p-4 rounded-xl border flex flex-col justify-center items-center gap-3 transition-all relative overflow-hidden group',
                  m.is_mandatory ? 'bg-brand-500/10 border-brand-500/50 shadow-[0_0_20px_rgba(14,165,233,0.1)] cursor-not-allowed opacity-80' : '',
                  extraIds.includes(m.id) ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : '',
                  (!m.is_mandatory && !extraIds.includes(m.id)) ? 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10' : ''
                ]"
              >
                <!-- Badge Selected -->
                <div v-if="m.is_mandatory" class="absolute top-0 right-0 py-1 px-3 bg-brand-500 text-white text-[10px] font-bold rounded-bl-xl tracking-wider">OBRIGATÓRIO</div>
                <div v-if="extraIds.includes(m.id)" class="absolute top-0 right-0 py-1 px-3 bg-orange-500 text-white text-[10px] font-bold rounded-bl-xl tracking-wider">EXTRA</div>
                
                <div class="text-[10px] text-gray-500 font-mono w-full text-center">
                  {{ formatDate(m.data_partida) }}
                </div>
                
                <div class="flex items-center justify-between w-full h-12 px-2">
                  <div class="flex-1 flex flex-col items-center">
                    <img v-if="getShield(m.api_team_home_id)" :src="getShield(m.api_team_home_id)" class="w-8 h-8 object-contain mb-1" />
                    <span class="text-xs font-bold text-white text-center leading-tight">{{ m.time_casa }}</span>
                  </div>
                  <div class="px-3 text-xs text-gray-500 font-bold uppercase">X</div>
                  <div class="flex-1 flex flex-col items-center">
                     <img v-if="getShield(m.api_team_away_id)" :src="getShield(m.api_team_away_id)" class="w-8 h-8 object-contain mb-1" />
                    <span class="text-xs font-bold text-white text-center leading-tight">{{ m.time_fora }}</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-white/10 shrink-0 flex items-center justify-between bg-white/[0.02]">
            <p class="text-xs text-orange-400" v-if="extraIds.length < calculatedExtras">
              Faltam {{ calculatedExtras - extraIds.length }} jogos extras
            </p>
            <p class="text-xs text-emerald-400 font-bold flex items-center gap-1" v-else>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              Pronto para abrir a rodada!
            </p>

            <div class="flex items-center gap-3">
              <button @click="$emit('close')" class="px-5 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancelar</button>
              <button
                @click="salvar"
                :disabled="extraIds.length !== calculatedExtras || salvando"
                class="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                <span v-if="salvando" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Abrir Rodada ao Público
              </button>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  open: boolean,
  rodada: any,
  organizerId: string
}>()

const emit = defineEmits(['close', 'saved'])

const extraIds = ref<string[]>([])
const salvando = ref(false)

const escudosMap = ref<Record<number, string>>({})
const supabase = useSupabaseClient<any>()

// Timer logic
const now = ref(new Date())
let timerInterval: any = null

const participantTeamApiIds = ref<Set<number>>(new Set())

onMounted(async () => {
  timerInterval = setInterval(() => {
    now.value = new Date()
  }, 1000)

  const { data } = await supabase.from('times').select('api_team_id, escudo_url')
  if (data) {
    data.forEach((t: any) => {
      escudosMap.value[t.api_team_id] = t.escudo_url
    })
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

const orgTimeRemaining = computed(() => {
  if (!props.rodada?.organizer_deadline) return null
  
  const limit = new Date(props.rodada.organizer_deadline)
  const diff = limit.getTime() - now.value.getTime()
  
  if (diff <= 0) return 'PRAZO EXPIRADO'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const secs = Math.floor((diff % (1000 * 60)) / 1000)
  
  return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`
})

const getShield = (apiId: number) => escudosMap.value[apiId]

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' -')
}

// Busca os times dos participantes do campeonato ativo para saber quais jogos são obrigatórios
const { campeonatoAtivo } = useCampeonato()

const fetchParticipantTeams = async () => {
  if (!campeonatoAtivo.value) return
  try {
    const { teamApiIds } = await $fetch<{ teamApiIds: number[] }>('/api/app/participant-teams', {
      params: { campeonato_id: campeonatoAtivo.value.id }
    })
    participantTeamApiIds.value = new Set(teamApiIds || [])
  } catch (e) {
    console.error('Erro ao buscar times dos participantes:', e)
  }
}

// Recalcula is_mandatory dinamicamente com base nos times dos participantes
const partidasComMandatory = computed(() => {
  if (!props.rodada?.partidas) return []
  const teamIds = participantTeamApiIds.value
  return props.rodada.partidas.map((p: any) => {
    const dynamicMandatory = teamIds.size > 0 && (teamIds.has(p.api_team_home_id) || teamIds.has(p.api_team_away_id))
    return {
      ...p,
      is_mandatory: p.is_mandatory || dynamicMandatory
    }
  })
})

// Regra: "dois jogos extras" + 1 por cada confronto direto entre times dos participantes
const calculatedExtras = computed(() => {
  const teamIds = participantTeamApiIds.value
  if (teamIds.size === 0) return props.rodada?.required_extra_games || 2
  
  let confrontations = 0
  for (const p of (props.rodada?.partidas || [])) {
    if (teamIds.has(p.api_team_home_id) && teamIds.has(p.api_team_away_id)) {
      confrontations++
    }
  }
  return 2 + confrontations
})

const partidasOrdenadas = computed(() => {
  return [...partidasComMandatory.value].sort((a, b) => new Date(a.data_partida).getTime() - new Date(b.data_partida).getTime())
})

// Reseta ao abrir
watch(() => props.open, async (val) => {
  if (val) {
    await fetchParticipantTeams()
    extraIds.value = props.rodada.partidas.filter((p:any) => p.is_extra).map((p:any) => p.id)
  }
})

const selecionar = (partidaId: string) => {
  const p = partidasComMandatory.value.find((x:any) => x.id === partidaId)
  if (p?.is_mandatory) return // bloqueado
  
  if (extraIds.value.includes(partidaId)) {
    extraIds.value = extraIds.value.filter(id => id !== partidaId)
  } else {
    if (extraIds.value.length < calculatedExtras.value) {
      extraIds.value.push(partidaId)
    }
  }
}

const salvar = async () => {
  if (extraIds.value.length !== calculatedExtras.value) return
  salvando.value = true
  try {
    await $fetch('/api/rounds/setup', {
      method: 'POST',
      body: {
        rodada_id: props.rodada.id,
        organizer_id: props.organizerId,
        extra_match_ids: extraIds.value
      }
    })
    emit('saved')
    emit('close')
  } catch (e: any) {
    console.error(e)
    alert(e.data?.message || 'Erro ao organizar a rodada.')
  } finally {
    salvando.value = false
  }
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
