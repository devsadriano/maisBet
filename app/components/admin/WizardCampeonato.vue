<template>
  <div class="flex flex-col h-full bg-[#111111] overflow-hidden rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl relative">
    <!-- Header/Close -->
    <button @click="$emit('close')" class="absolute top-4 right-4 z-50 text-gray-500 hover:text-white transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
    
    <div class="p-6 border-b border-white/5 bg-white/[0.02]">
      <h3 class="text-3xl font-bebas text-white tracking-wide flex items-center gap-3">
        <span class="text-emerald-500 bg-emerald-500/10 p-2 rounded-xl text-xl">🏆</span>
        Criar Novo Campeonato
      </h3>
      <p class="text-sm text-gray-400 mt-2">
        Siga os passos abaixo para configurar dinamicamente. Os dados serão sugeridos automaticamente.
      </p>

      <!-- Steps Indicator -->
      <div class="flex items-center mt-6 relative">
        <div class="absolute left-0 top-1/2 w-full h-1 bg-white/10 -z-10 rounded-full overflow-hidden">
          <div class="h-full bg-emerald-500 transition-all duration-500" :style="{ width: step === 1 ? '50%' : '100%' }"></div>
        </div>
        <div class="flex justify-between w-full z-10 px-4">
          <div class="flex flex-col items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
                :class="step >= 1 ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-gray-800 text-gray-500'">1</div>
            <span class="text-[10px] uppercase font-black tracking-widest" :class="step >= 1 ? 'text-emerald-400' : 'text-gray-600'">Selecionar Liga</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
                :class="step >= 2 ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-gray-800 text-gray-500'">2</div>
            <span class="text-[10px] uppercase font-black tracking-widest" :class="step >= 2 ? 'text-emerald-400' : 'text-gray-600'">Customização Final</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar p-6 relative">
      
      <!-- STEP 1: SELECT LEAGUE -->
      <div v-if="step === 1" class="animate-fade-in-up">
        
        <div class="relative mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-4 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar campeonato ou país... (ex: Brasil, Premier League)" 
            class="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-600"
          >
        </div>

        <div v-if="loadingLeagues" class="py-10 text-center flex flex-col items-center">
          <div class="w-8 h-8 border-4 border-t-emerald-500 border-white/10 rounded-full animate-spin mb-4"></div>
          <span class="text-emerald-400 font-bebas tracking-widest text-lg animate-pulse">Sincronizando banco de ligas...</span>
        </div>

        <div v-else-if="leaguesError" class="py-10 text-center">
          <p class="text-red-400 font-bold mb-2">Erro ao carregar lista da API externa.</p>
          <button @click="fetchLeagues" class="text-sm underline text-red-300">Tentar Novamente</button>
        </div>

        <div v-else class="space-y-3">
          <p v-if="filteredLeagues.length === 0" class="text-gray-500 text-center py-4">Nenhuma liga encontrada com este nome.</p>
          
          <button 
            v-for="league in filteredLeagues" 
            :key="league.id"
            @click="selectLeague(league)"
            class="w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between transition-all group group-hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] text-left"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-white rounded flex items-center justify-center p-1.5 overflow-hidden border border-white/10">
                <img v-if="league.emblem" :src="league.emblem" class="w-full h-full object-contain" :alt="league.name" loading="lazy">
                <span v-else class="text-2xl opacity-50 shrink-0">⚽</span>
              </div>
              <div>
                <h4 class="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors">{{ league.name }}</h4>
                <div class="flex items-center gap-2 mt-1">
                  <img v-if="league.area?.flag" :src="league.area.flag" class="w-4 h-3 rounded-sm object-cover" :alt="league.area?.name">
                  <span v-else class="text-gray-500 text-[10px] uppercase font-black">🌍</span>
                  <p class="text-xs text-gray-500 uppercase font-black tracking-widest">{{ league.area?.name || 'Global' }}</p>
                </div>
              </div>
            </div>
            
            <div class="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest hidden sm:block">
              Selecionar
            </div>
          </button>
        </div>
      </div>

      <!-- STEP 2: FINALIZE AND EDIT -->
      <div v-else-if="step === 2" class="animate-fade-in-up">
        
        <div v-if="loadingLeagueDetails" class="py-20 text-center flex flex-col items-center">
            <div class="w-10 h-10 border-4 border-t-emerald-500 border-white/10 rounded-full animate-spin mb-4"></div>
            <span class="text-emerald-400 font-bebas tracking-widest text-xl animate-pulse">Extraindo Dados da Temporada...</span>
            <p class="text-gray-500 text-sm mt-2">Buscando datas e times na Football-Data API.</p>
        </div>
        
        <form v-else @submit.prevent="finalize" class="space-y-6">
            
            <!-- Info Banner UX -->
            <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-4 text-emerald-400 text-sm items-start">
               <span class="text-2xl shadow-green-glow">✨</span>
               <div>
                 <strong class="block mb-1 text-white">Auto Preenchido com Sucesso!</strong>
                 Tudo abaixo já foi sugerido pela API. Se quiser customizar o nome, data ou rodadas, sinta-se livre para alterar! 
               </div>
            </div>

            <!-- Identidade Visual -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div class="md:col-span-1 flex flex-col gap-2 relative">
                 <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Logo URL</label>
                 <div class="w-full aspect-square bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden p-4 group">
                    <img v-if="form.logo_url" :src="form.logo_url" class="w-full h-full object-contain drop-shadow-2xl opacity-90 group-hover:opacity-100 transition-opacity" :alt="form.nome">
                    <span v-else class="text-4xl opacity-20">⚽</span>
                    <!-- Pode adicionar botao de trocar foto em cima no futuro -->
                 </div>
                 <input type="text" v-model="form.logo_url" class="absolute opacity-0 w-1 h-1 pointer-events-none"> 
              </div>

              <div class="md:col-span-3 space-y-4">
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Nome do Bolão/Liga</label>
                    <input v-model="form.nome" type="text" required class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-bold text-lg shadow-inner">
                 </div>
                 <div>
                    <label class="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1.5">📎 Apelido do Grupo (Opcional)</label>
                    <input v-model="form.apelido_grupo" type="text" placeholder="Ex: Turma do Adriano, Galera do Trabalho..." class="w-full bg-black/40 border border-amber-500/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm placeholder:text-gray-600">
                    <p class="text-[10px] text-gray-600 mt-1">Ajuda a diferenciar campeonatos iguais para grupos distintos.</p>
                 </div>
                 
                 <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Abrev. API</label>
                      <input v-model="form.api_competition_code" type="text" required readonly class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none text-sm opacity-80 cursor-not-allowed uppercase" tabindex="-1">
                    </div>
                    <div>
                      <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Temporada (Ano)</label>
                      <input v-model="form.season" type="number" required readonly class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none text-sm font-mono opacity-80 cursor-not-allowed" tabindex="-1">
                    </div>
                 </div>
              </div>
            </div>

            <!-- Detalhes de Temporada -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border border-white/5 bg-white/[0.01] rounded-2xl">
                <div>
                   <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 flex justify-between">Início <span>🏁</span></label>
                   <input v-model="form.start_date" type="date" class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-gray-300 focus:outline-none focus:border-emerald-500 text-xs">
                </div>
                <div>
                   <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 flex justify-between">Fim <span>🏆</span></label>
                   <input v-model="form.end_date" type="date" class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-gray-300 focus:outline-none focus:border-emerald-500 text-xs">
                </div>
                <div>
                   <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 flex justify-between">Rodadas Totais <span>🔢</span></label>
                   <input v-model="form.max_rodadas" type="number" min="1" required class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm font-mono">
                </div>
            </div>

            <!-- Scoring System -->
            <div>
              <label class="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Motor de Pontuação</label>
              <select v-model="form.scoring_system_id" required class="w-full bg-emerald-500/5 border border-emerald-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none shadow-[0_0_10px_rgba(16,185,129,0.05)] cursor-pointer">
                <option v-for="sys in sistemas" :key="sys.id" :value="sys.id" class="bg-gray-900 text-white">{{ sys.nome }} - {{ sys.descricao }}</option>
              </select>
            </div>

            <!-- Premiação -->
            <div>
              <label class="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1.5">Regras de Premiação / Castigo</label>
              <textarea v-model="form.detalhes_premiacao" rows="3" placeholder="Ex: 1º Lugar leva R$200 e o último paga a conta... (Opcional)" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"></textarea>
            </div>

            <!-- Error Banner -->
            <div v-if="errorMessage" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex items-start gap-3">
               <span class="text-xl">⚠️</span>
               <div>
                 <strong class="block text-white mb-1">Erro ao salvar</strong>
                 {{ errorMessage }}
               </div>
            </div>

        </form>
      </div>
      
    </div>

    <!-- Footer Controls -->
    <div v-if="step === 2" class="p-6 border-t border-white/5 bg-[#111111] flex items-center justify-between shrink-0">
      <button @click="backToSearch" type="button" class="px-5 py-2.5 text-sm font-bold tracking-widest uppercase text-gray-400 hover:text-white transition-colors flex items-center gap-2">
         &larr; Voltar
      </button>

      <button @click="finalize" type="button" :disabled="isSubmitting" class="px-8 py-3 bg-emerald-500 text-black font-black rounded-xl uppercase tracking-widest disabled:opacity-50 transition-transform hover:-translate-y-0.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]">
        {{ isSubmitting ? 'Gerando...' : 'GERAR CAMPEONATO' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  sistemas: any[]
}>()

const emit = defineEmits(['close', 'created'])

const supabase = useSupabaseClient()
const step = ref(1)
const errorMessage = ref('')

// -- State Passo 1 --
const rawLeagues = ref<any[]>([])
const loadingLeagues = ref(false)
const leaguesError = ref(false)
const searchQuery = ref('')

const fetchLeagues = async () => {
    loadingLeagues.value = true
    leaguesError.value = false
    try {
        const result: any = await $fetch('/api/admin/wizard/leagues')
        rawLeagues.value = result.leagues || []
    } catch(e) {
        console.error(e)
        leaguesError.value = true
    } finally {
        loadingLeagues.value = false
    }
}

const filteredLeagues = computed(() => {
    if(!searchQuery.value) return rawLeagues.value.slice(0, 50)
    const q = searchQuery.value.toLowerCase()
    return rawLeagues.value.filter(l => 
        l.name?.toLowerCase().includes(q) || 
        l.area?.name?.toLowerCase().includes(q) ||
        l.code?.toLowerCase().includes(q)
    ).slice(0, 20)
})

onMounted(() => {
    fetchLeagues()
})

// -- State Passo 2 --
const loadingLeagueDetails = ref(false)
const isSubmitting = ref(false)

const form = ref({
   nome: '',
   apelido_grupo: '',
   api_competition_code: '',
   season: new Date().getFullYear(),
   max_rodadas: 38,
   scoring_system_id: '',
   logo_url: '',
   area_name: '',
   area_flag: '',
   start_date: '',
   end_date: '',
   detalhes_premiacao: ''
})

const selectLeague = async (leagueParam: any) => {
    step.value = 2
    loadingLeagueDetails.value = true
    errorMessage.value = ''
    
    // Auto-preenche defaults para UI imediata
    form.value.nome = leagueParam.name
    form.value.api_competition_code = leagueParam.code || String(leagueParam.id || '')
    form.value.logo_url = leagueParam.emblem
    form.value.area_name = leagueParam.area?.name
    form.value.area_flag = leagueParam.area?.flag
    
    // Configura regras default se não tiver escolhido antes
    if (props.sistemas?.length > 0 && !form.value.scoring_system_id) {
       const def = props.sistemas.find((x: any) => x.is_default)
       form.value.scoring_system_id = def ? def.id : props.sistemas[0].id
    }

    // Busca detalhes mais pesados (Datas e Rodadas)
    try {
        const { league: details }: any = await $fetch(`/api/admin/wizard/league/${leagueParam.code}`)
        
        if (details.startDate) form.value.start_date = details.startDate
        if (details.endDate) form.value.end_date = details.endDate
        if (details.suggestedMax) form.value.max_rodadas = details.suggestedMax
        
        if (details.startDate) {
            form.value.season = parseInt(details.startDate.slice(0,4))
        }

    } catch (e) {
        console.warn('Erro ao buscar detalhes profundos da liga:', e)
    } finally {
        loadingLeagueDetails.value = false
    }
}

const backToSearch = () => {
    step.value = 1
    errorMessage.value = ''
}

const finalize = async () => {
    isSubmitting.value = true
    errorMessage.value = ''
    
    if (!form.value.api_competition_code) {
        errorMessage.value = 'O Código da API não pode estar vazio. Tente pesquisar a liga novamente.'
        isSubmitting.value = false
        return
    }

    try {
        const { data, error } = await supabase.from('campeonatos').insert({
            nome: form.value.nome,
            apelido_grupo: form.value.apelido_grupo || null,
            api_competition_code: form.value.api_competition_code.toUpperCase(),
            season: form.value.season,
            max_rodadas: form.value.max_rodadas,
            scoring_system_id: form.value.scoring_system_id,
            status: 'rascunho',
            logo_url: form.value.logo_url || null,
            area_name: form.value.area_name || null,
            area_flag: form.value.area_flag || null,
            start_date: form.value.start_date || null,
            end_date: form.value.end_date || null,
            detalhes_premiacao: form.value.detalhes_premiacao || null
        }).select().single()
        
        if (error) {
            errorMessage.value = error.message
        } else {
            emit('created', data)
        }
    } catch (e: any) {
        console.error('Erro inesperado:', e)
        errorMessage.value = e.message || 'Erro inesperado ao salvar.'
    } finally {
        isSubmitting.value = false
    }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }

.animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
