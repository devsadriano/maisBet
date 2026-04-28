<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3 mb-2">
      <div class="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-400 text-xl shadow-inner">🏆</div>
      <div>
        <h3 class="text-xl font-bebas tracking-wider text-white">Palpites Especiais</h3>
        <p class="text-gray-400 text-xs uppercase tracking-widest font-black">Bônus de Final de Campeonato</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Campeão -->
      <BaseCard class="relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-20 h-20 bg-brand-500/5 rounded-full blur-2xl group-hover:bg-brand-500/10 transition-all"></div>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400/80">Vencedor Final</span>
            <span class="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">10 PTS</span>
          </div>
          <h4 class="text-lg font-bebas text-white tracking-widest uppercase">Grande Campeão</h4>
          <select 
            v-model="state.campeao" 
            :disabled="isLocked"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all appearance-none cursor-pointer"
            @change="saveBet('campeao')"
          >
            <option value="" disabled>Escolha a seleção campeã...</option>
            <option v-for="team in availableTeams" :key="team.id" :value="team.nome" class="bg-pitch-900 text-white">
              {{ team.nome }}
            </option>
          </select>
        </div>
      </BaseCard>

      <!-- Artilheiro -->
      <BaseCard class="relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/80">Goleador</span>
            <span class="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">10 PTS</span>
          </div>
          <h4 class="text-lg font-bebas text-white tracking-widest uppercase">Artilheiro</h4>
          <input 
            v-model="state.artilheiro" 
            type="text" 
            placeholder="Ex: Vinícius Jr."
            :disabled="isLocked"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
            @blur="saveBet('artilheiro')"
          />
        </div>
      </BaseCard>

      <!-- Melhor Grupo -->
      <BaseCard class="relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/80">Melhor Campanha</span>
            <span class="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">5 PTS</span>
          </div>
          <h4 class="text-lg font-bebas text-white tracking-widest uppercase">Melhor do Grupo</h4>
          <select 
            v-model="state.melhor_grupo" 
            :disabled="isLocked"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all appearance-none cursor-pointer"
            @change="saveBet('melhor_grupo')"
          >
            <option value="" disabled>Selecione a melhor seleção...</option>
            <option v-for="team in availableTeams" :key="team.id" :value="team.nome" class="bg-pitch-900 text-white">
              {{ team.nome }}
            </option>
          </select>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useToast } from '~/composables/useToast'
import BaseCard from '~/components/ui/BaseCard.vue'

const props = defineProps<{
  campeonatoId: string
  isLocked: boolean
}>()

const state = reactive({
  campeao: '',
  artilheiro: '',
  melhor_grupo: ''
})

const { success, error: toastError } = useToast()

const { data: availableTeams } = await useFetch<any[]>('/api/app/championship-teams', {
  query: { campeonato_id: props.campeonatoId }
})

const fetchBets = async () => {
  try {
    const data = await $fetch<any[]>(`/api/app/special-bets`, {
      query: { campeonato_id: props.campeonatoId }
    })
    
    data.forEach(b => {
      if (b.tipo === 'campeao') state.campeao = b.valor
      if (b.tipo === 'artilheiro') state.artilheiro = b.valor
      if (b.tipo === 'melhor_grupo') state.melhor_grupo = b.valor
    })
  } catch (e: any) {
    console.error('Erro ao buscar palpites especiais:', e)
  }
}

const saveBet = async (tipo: 'campeao' | 'artilheiro' | 'melhor_grupo') => {
  if (props.isLocked) return
  
  const valor = state[tipo]
  if (!valor) return

  try {
    await $fetch('/api/app/special-bets', {
      method: 'POST',
      body: {
        campeonato_id: props.campeonatoId,
        tipo,
        valor
      }
    })
    success(`🎯 Palpite para ${tipo} salvo!`)
  } catch (e: any) {
    toastError('Erro ao salvar palpite especial')
  }
}

onMounted(() => {
  fetchBets()
})
</script>
