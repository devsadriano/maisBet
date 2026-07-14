<template>
  <div class="space-y-8 pb-10">
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <NuxtLink to="/admin" class="text-[var(--brand)] hover:underline text-sm mb-2 inline-block">&larr; Voltar ao Painel</NuxtLink>
        <h1 class="text-3xl font-bebas tracking-wider text-white">Gestão de Campeonatos</h1>
        <p class="text-sm text-gray-400">Crie novos torneios, vincule Regras e importe rodadas da API.</p>
      </div>
      <button @click="openCreateModal" class="px-6 py-2 bg-[var(--brand)] text-white font-bold rounded-xl transition-transform hover:-translate-y-0.5 shadow-lg">
        + Novo Campeonato
      </button>
    </header>

    <!-- Content -->
    <div v-if="loading" class="py-10 text-center">
      <div class="w-8 h-8 border-4 border-t-[var(--brand)] border-[var(--brand-dim)] rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-gray-400">Carregando campeonatos...</p>
    </div>
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="camp in campeonatos" :key="camp.id" class="bg-white/5 border border-white/10 rounded-2xl p-6 relative flex flex-col justify-between">
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <span class="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded" :class="camp.status === 'ativo' ? 'bg-emerald-500/20 text-emerald-400' : (camp.status === 'arquivado' ? 'bg-gray-500/20 text-gray-400' : 'bg-amber-500/20 text-amber-500')">
              {{ camp.status }}
            </span>
            <span class="text-xs text-gray-500 font-mono">{{ camp.api_competition_code }}</span>
          </div>
          <h2 class="text-2xl font-bebas tracking-wide text-white mb-1">{{ camp.nome }}</h2>
          <p v-if="camp.apelido_grupo" class="text-xs text-amber-400 font-bold mb-1">📎 {{ camp.apelido_grupo }}</p>
          <p class="text-sm text-gray-400 mb-1">Temporada: {{ camp.season }} &bull; Max Rodadas: {{ camp.max_rodadas }}</p>
          <p class="text-xs text-gray-500">
            Criado em: {{ new Date(camp.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
          </p>
          <div class="mt-4 p-3 bg-black/20 rounded-lg text-xs text-gray-300 flex items-center justify-between gap-2">
            <span>Regras de Box: <span class="font-bold text-[var(--brand)]">{{ camp.scoring_systems?.nome || 'Padrão' }}</span></span>

            <!-- Formato BLOQUEADO (campeonato já iniciado/arquivado) -->
            <span
              v-if="camp.status !== 'rascunho'"
              :title="'Formato ' + (camp.formato === 'copa' ? 'Copa' : 'Liga') + ' — não pode ser alterado após o campeonato ser iniciado'"
              class="flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border cursor-not-allowed select-none opacity-70"
              :class="camp.formato === 'copa'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {{ camp.formato === 'copa' ? '🌍 Copa' : '🏟️ Liga' }}
            </span>

            <!-- Formato EDITÁVEL (apenas rascunhos) -->
            <button
              v-else
              @click="toggleFormato(camp)"
              :title="'Formato atual: ' + (camp.formato || 'liga') + ' — clique para alternar (apenas disponível em rascunhos)'"
              class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border transition-colors shrink-0"
              :class="camp.formato === 'copa'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30'"
            >
              {{ camp.formato === 'copa' ? '🌍 Copa' : '🏟️ Liga' }}
            </button>
          </div>
        </div>
        
        <div class="flex gap-2">
          <button 
             v-if="camp.status === 'rascunho'" 
             @click="iniciarBolao(camp.id)" 
             class="flex-1 py-3 px-4 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
             :disabled="isStarting === camp.id"
          >
            {{ isStarting === camp.id ? 'Baixando...' : '▶ IMPORTAR & INICIAR' }}
          </button>
          
          <button v-if="camp.status === 'ativo'" @click="arquivarBolao(camp.id)" class="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors active:scale-95">
            Arquivar do Painel
          </button>
          <button v-if="camp.status === 'arquivado'" @click="reativarBolao(camp.id)" class="py-2 px-4 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 hover:border-brand-500/40 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors active:scale-95">
            Reativar
          </button>
          
          <button v-if="camp.status !== 'ativo'" @click="deletarBolao(camp.id)" class="py-2 px-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20" title="Excluir Definitivamente">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
      
      <div v-if="campeonatos.length === 0" class="col-span-full py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
        <p class="text-gray-400 mb-4 font-bold tracking-widest text-sm uppercase">Nenhum campeonato encontrado.</p>
        <button @click="openCreateModal" class="px-6 py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 hover:border-brand-500/40 rounded-xl transition-all text-sm font-bold uppercase tracking-wider active:scale-95">Criar Primeiro Campeonato</button>
      </div>
    </div>

    <!-- Modal Wizard Novo Campeonato -->
    <div v-if="showModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 pb-20 sm:pb-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <WizardCampeonato 
        @close="showModal = false" 
        @created="onCampeonatoCriado" 
        :sistemas="sistemas" 
      />
    </div>
    <BaseToast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseToast from '~/components/ui/BaseToast.vue'
import WizardCampeonato from '~/components/admin/WizardCampeonato.vue'
import { useToast } from '~/composables/useToast'

definePageMeta({ middleware: 'is-admin' })

const supabase = useSupabaseClient()
const campeonatos = ref<any[]>([])
const sistemas = ref<any[]>([])
const loading = ref(true)
const isStarting = ref<string | null>(null)
const showModal = ref(false)
const toast = useToast()

const fetchDados = async () => {
   loading.value = true
   const { data: c } = await supabase.from('campeonatos').select('*, scoring_systems(*)').order('created_at', { ascending: false })
   const { data: s } = await supabase.from('scoring_systems').select('*').order('nome')
   campeonatos.value = c || []
   sistemas.value = s || []
   
   loading.value = false
}

onMounted(() => {
   fetchDados()
})

const openCreateModal = () => {
   showModal.value = true
}

const onCampeonatoCriado = async (newCamp?: any) => {
   showModal.value = false
   toast.success('Campeonato cadastrado com sucesso!')
   
   // Wait a slight delay to let user read modal success, then fetch all fresh
   await fetchDados()
}

// Apenas disponível para rascunhos (a UI bloqueia o botão para ativo/arquivado)
const toggleFormato = async (camp: any) => {
  const novoFormato = camp.formato === 'copa' ? 'liga' : 'copa'
  const { error } = await supabase
    .from('campeonatos')
    .update({ formato: novoFormato })
    .eq('id', camp.id)
  if (!error) {
    camp.formato = novoFormato
    toast.success(`Formato de "${camp.nome}" alterado para ${novoFormato === 'copa' ? '🌍 Copa' : '🏟️ Liga'}`)
  } else {
    toast.error('Erro ao atualizar formato: ' + error.message)
  }
}

const arquivarBolao = async (id: string) => {
   if(!confirm('Tem certeza que deseja ARQUIVAR este campeonato? O layout sumirá da tela principal.')) return
   await supabase.from('campeonatos').update({ status: 'arquivado' }).eq('id', id)
   fetchDados()
}

const reativarBolao = async (id: string) => {
   await supabase.from('campeonatos').update({ status: 'ativo' }).eq('id', id)
   fetchDados()
}

const deletarBolao = async (id: string) => {
  if (!confirm('Excluir Campeonato? Irreversível.')) return

  try {
    // 1. Deletar solicitações vinculadas
    const { error: errSol } = await supabase.from('solicitacoes').delete().eq('campeonato_id', id)
    if (errSol) throw errSol

    // 2. Deletar acessos vinculados
    const { error: errAce } = await supabase.from('campeonato_acessos').delete().eq('campeonato_id', id)
    if (errAce) throw errAce

    // 3. Deletar rodadas vinculadas (cascateia para partidas e palpites)
    const { error: errRod } = await supabase.from('rodadas').delete().eq('campeonato_id', id)
    if (errRod) throw errRod

    // 4. Deletar o campeonato em si
    const { error: errCamp } = await supabase.from('campeonatos').delete().eq('id', id)
    if (errCamp) throw errCamp

    toast.success('Campeonato excluído com sucesso!')
    await fetchDados()
  } catch (error: any) {
    console.error('Erro ao deletar campeonato:', error)
    toast.error('Erro ao deletar: ' + (error.message || error))
  }
}


const iniciarBolao = async (id: string) => {
  if (!confirm('Iniciar Bolão e importar rodadas da API? Isso pode demorar 1-2 minutos devido ao Limite de Taxas.')) return
  
  isStarting.value = id
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Não autenticado.')

    const response = await fetch('/api/admin/start-championship', {
      method: 'POST',
      headers: { 
         'Authorization': `Bearer ${session.access_token}`,
         'Content-Type': 'application/json'
      },
      body: JSON.stringify({ campeonato_id: id })
    })
    
    const result = await response.json()
    
    if (response.ok && result.success && result.totalRoundsImported > 0) {
       await supabase.from('campeonatos').update({ status: 'ativo' }).eq('id', id)
       toast.success(`Importadas ${result.totalRoundsImported} rodadas com sucesso!`)
       fetchDados()
    } else if (response.ok && result.totalRoundsImported === 0) {
       toast.error(`Nenhuma rodada foi importada. ${result.totalErrors || 0} erros. Verifique o terminal do servidor.`)
    } else {
       throw new Error(result.message || 'Erro ao inicializar.')
    }
  } catch(e: any) {
    toast.error(e.message)
  } finally {
    isStarting.value = null
  }
}
</script>
