<template>
  <div class="space-y-8">
    
    <!-- HEADER -->
    <div class="flex items-center justify-between">
      <div>
        <NuxtLink to="/admin" class="text-sm text-gray-400 hover:text-white mb-2 flex items-center gap-1 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao Painel Admin
        </NuxtLink>
        <h1 class="text-3xl font-bebas tracking-wider text-white">Sincronização API</h1>
        <p class="text-sm text-gray-400 mt-1">Conecte o +BET à base de dados do Football-Data.org.</p>
      </div>
    </div>

    <!-- MAIN GRID -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- INICIAR BOLÃO FOI MOVIDO PARA /ADMIN/CAMPEONATOS -->

      <!-- TIMES & ESCUDOS --> <!-- TIMES & ESCUDOS -->
      <div class="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
        <div>
          <div class="w-12 h-12 bg-brand-500/20 text-brand-400 rounded-xl flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 class="text-xl font-sans font-semibold tracking-tight text-white mb-2">Escudos dos Times</h2>
          <p class="text-sm font-sans text-gray-300 leading-relaxed mb-6">
            Puxa as URLs dos escudos usando a API Football-Data.org e preenche a tabela no sistema.
          </p>
          
          <div class="mb-6">
            <label class="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Selecione o Campeonato</label>
            <select v-model="selectedCompetition" class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-sans cursor-pointer relative z-20">
               <option v-for="camp in activeCampeonatos" :key="camp.api_competition_code" :value="camp.api_competition_code">
                  {{ camp.nome }}
               </option>
            </select>
          </div>
        </div>
        
        <button 
          @click="syncTeams" 
          :disabled="syncingTeams"
          class="w-full flex justify-center py-3 px-4 border border-brand-500 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="syncingTeams" class="animate-pulse">Sincronizando...</span>
          <span v-else>Atualizar Escudos</span>
        </button>
      </div>

      <!-- STATUS DA AUTOMAÇÃO (CRON) -->
      <div class="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
        <div>
          <div class="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-xl font-sans font-semibold tracking-tight text-white mb-2">Status da Automação</h2>
          <p class="text-sm font-sans text-gray-300 leading-relaxed mb-4">
            O ciclo de automação (Auto-Cycle) gerencia placares, rodadas e jogos extras automaticamente. O cron roda a cada hora.
          </p>
          <div class="mb-4">
            <div class="p-4 bg-black/20 rounded-xl border border-white/5">
              <div class="flex items-center gap-2 mb-2">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span class="text-xs uppercase font-bold tracking-widest text-emerald-400">Ativo & Rodando</span>
              </div>
              <div class="text-xs text-gray-400">
                <span class="font-bold text-gray-300">Última execução:</span> {{ lastCronRun || 'Buscando...' }}
              </div>
            </div>
          </div>
        </div>
        
        <button 
          @click="fetchCronStatus"
          class="w-full flex justify-center py-3 px-4 border border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/20 text-white font-medium rounded-xl transition-all"
        >
          Atualizar Status
        </button>
      </div>

    </div>

    <!-- FEEDBACK TOASTS -->
    <div v-if="message" :class="`p-4 rounded-xl border flex items-center gap-3 ${messageType === 'success' ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' : 'bg-danger-500/10 border-danger-500/30 text-danger-400'}`">
      {{ message }}
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '~/composables/useToast'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

definePageMeta({
  middleware: 'is-admin'
})

const { success: toastSuccess, error: toastError } = useToast()
const supabase = useSupabaseClient<any>()

// -- Escudos --
const syncingTeams = ref(false)
const selectedCompetition = ref('BSA')
const activeCampeonatos = ref<any[]>([])

const message = ref('')
const messageType = ref<'success' | 'error'>('success')

async function fetchCampeonatos() {
  const { data } = await supabase
    .from('campeonatos')
    .select('nome, api_competition_code')
    .eq('status', 'ativo')
    .order('created_at', { ascending: false })
    
  if (data && data.length > 0) {
    activeCampeonatos.value = data
    selectedCompetition.value = data[0]?.api_competition_code || 'BSA'
  }
}

async function syncTeams() {
  syncingTeams.value = true
  message.value = ''
  
  try {
    const data = await $fetch('/api/sync/teams', { 
      method: 'POST',
      body: { api_competition_code: selectedCompetition.value }
    })
    messageType.value = 'success'
    message.value = `Sucesso! Foram sincronizados ${data.updated} escudos.`
  } catch (e: any) {
    console.error(e)
    messageType.value = 'error'
    message.value = e.data?.message || e.message || 'Erro ao sincronizar escudos.'
  } finally {
    syncingTeams.value = false
  }
}

// -- Status do Cron --
const lastCronRun = ref<string>('')

async function fetchCronStatus() {
  const { data } = await supabase
    .from('cron_logs')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
    
  if (data) {
    lastCronRun.value = dayjs(data.created_at).fromNow()
  } else {
    lastCronRun.value = 'Nunca executado'
  }
}

// Removida lógica de startChampionship pois foi migrada para Gestão de Campeonatos.
onMounted(() => {
  fetchCronStatus()
  fetchCampeonatos()
})
</script>
