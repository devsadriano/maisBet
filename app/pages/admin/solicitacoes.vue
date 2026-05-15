<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bebas tracking-wider text-white">Central de Pedidos</h1>
        <p class="text-sm text-gray-400 mt-1">Gerencie as solicitações de acesso ao sistema e aos bolões.</p>
      </div>
      <NuxtLink to="/admin" class="text-sm text-brand-400 hover:text-brand-300 font-medium">
        ← Voltar
      </NuxtLink>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 border-b border-white/10 pb-0.5">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="activeTab = tab.value"
        class="px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all border-b-2 -mb-[3px]"
        :class="activeTab === tab.value
          ? 'text-brand-400 border-brand-500 bg-brand-500/10'
          : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'"
      >
        {{ tab.label }}
        <span v-if="tab.value === 'pendente' && pendingCount > 0" class="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] inline-flex items-center justify-center">
          {{ pendingCount }}
        </span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-16 text-center text-gray-400 text-sm animate-pulse">
      Carregando solicitações...
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredList.length === 0" class="py-16 text-center space-y-4">
      <span class="text-5xl block opacity-50">📭</span>
      <h3 class="text-xl font-bebas text-gray-500 tracking-widest">Nenhuma solicitação {{ activeTab !== 'todas' ? activeTab : '' }}</h3>
    </div>

    <!-- Cards -->
    <div v-else class="space-y-4">
      <div
        v-for="sol in filteredList"
        :key="sol.id"
        class="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 hover:bg-white/[0.07] transition-colors"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-4">
            <!-- Avatar -->
            <div class="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center text-xl font-bebas text-brand-400 shrink-0">
              {{ (sol.nome || sol.email || '?').charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="text-white font-semibold truncate">{{ sol.nome || sol.email }}</p>
              <p class="text-xs text-gray-400 truncate">{{ sol.email }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span v-if="sol.telefone" class="text-[10px] text-gray-500">📞 {{ sol.telefone }}</span>
                <span v-if="sol.cidade || sol.estado" class="text-[10px] text-gray-500">📍 {{ sol.cidade }}{{ sol.cidade && sol.estado ? ' - ' : '' }}{{ sol.estado }}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <!-- Type Badge -->
            <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest"
                  :class="sol.tipo === 'acesso_sistema'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'">
              {{ sol.tipo === 'acesso_sistema' ? '🔑 Sistema' : '⚽ Bolão' }}
            </span>
            <!-- Status Badge -->
            <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest"
                  :class="{
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20': sol.status === 'pendente',
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': sol.status === 'aprovada',
                    'bg-red-500/10 text-red-400 border border-red-500/20': sol.status === 'rejeitada',
                  }">
              {{ sol.status === 'pendente' ? '🟡 Pendente' : sol.status === 'aprovada' ? '✅ Aprovada' : '❌ Rejeitada' }}
            </span>
          </div>
        </div>

        <!-- Bolão Info (for acesso_bolao) -->
        <div v-if="sol.tipo === 'acesso_bolao' && sol.campeonato" class="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5">
          <img v-if="sol.campeonato.logo_url" :src="sol.campeonato.logo_url" class="w-5 h-5 object-contain" />
          <span class="text-sm text-gray-300 font-medium">{{ sol.campeonato.nome }}</span>
          <span v-if="sol.campeonato.apelido_grupo" class="text-[10px] text-amber-400 font-bold">📎 {{ sol.campeonato.apelido_grupo }}</span>
        </div>

        <!-- Message -->
        <div v-if="sol.mensagem" class="text-sm text-gray-400 italic bg-white/[0.02] border border-white/5 rounded-xl p-3">
          "{{ sol.mensagem }}"
        </div>

        <!-- Rejection reason (if rejected) -->
        <div v-if="sol.status === 'rejeitada' && sol.motivo_rejeicao" class="text-sm text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-xl p-3">
          <span class="font-bold">Motivo:</span> {{ sol.motivo_rejeicao }}
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between pt-2 border-t border-white/5">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider">
            {{ timeAgo(sol.created_at) }}
            <span v-if="sol.resolved_at"> · Resolvido {{ timeAgo(sol.resolved_at) }}</span>
          </span>
          
          <!-- Actions (only for pending) -->
          <div v-if="sol.status === 'pendente'" class="flex items-center gap-2">
            <button
              @click="openRejectModal(sol)"
              class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-colors"
            >
              Rejeitar
            </button>
            <button
              @click="openApproveModal(sol)"
              class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition-colors"
            >
              Aprovar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ APPROVE MODAL ═══ -->
    <Teleport to="body">
      <div
        v-if="approveTarget"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click.self="approveTarget = null"
      >
        <div class="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bebas tracking-wider text-white">Aprovar Solicitação</h2>
              <p class="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{{ approveTarget.email }}</p>
            </div>
            <button @click="approveTarget = null" class="text-gray-400 hover:text-white transition-colors text-xl leading-none">✕</button>
          </div>

          <!-- Bolão selection (for sistema requests) -->
          <div v-if="approveTarget.tipo === 'acesso_sistema'" class="space-y-3">
            <p class="text-sm text-gray-300 font-medium">Atribuir acesso aos bolões:</p>
            <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
              <label
                v-for="camp in campeonatos"
                :key="camp.id"
                class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                :class="selectedBolaoIds.has(camp.id)
                  ? 'bg-brand-500/15 border-brand-500/40 text-white'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'"
              >
                <input
                  type="checkbox"
                  :checked="selectedBolaoIds.has(camp.id)"
                  @change="toggleBolao(camp.id)"
                  class="accent-brand-500 w-4 h-4 flex-shrink-0"
                />
                <img v-if="camp.logo_url" :src="camp.logo_url" class="w-5 h-5 object-contain" />
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-sm truncate">{{ camp.nome }}</p>
                  <p v-if="camp.apelido_grupo" class="text-[10px] text-amber-400 font-bold truncate">📎 {{ camp.apelido_grupo }}</p>
                </div>
              </label>
            </div>
          </div>

          <div v-else class="text-sm text-gray-400">
            <p>Confirmar acesso ao bolão <strong class="text-white">{{ approveTarget.campeonato?.nome || '—' }}</strong>?</p>
          </div>

          <div class="flex gap-3 pt-2">
            <button @click="approveTarget = null" class="flex-1 px-4 py-2 border border-white/10 text-gray-300 rounded-xl text-sm hover:bg-white/5 transition">
              Cancelar
            </button>
            <button
              @click="confirmApprove"
              :disabled="saving"
              class="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl text-sm transition disabled:opacity-50"
            >
              {{ saving ? 'Salvando...' : 'Aprovar e Liberar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ REJECT MODAL ═══ -->
    <Teleport to="body">
      <div
        v-if="rejectTarget"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click.self="rejectTarget = null"
      >
        <div class="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bebas tracking-wider text-white">Rejeitar Solicitação</h2>
              <p class="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{{ rejectTarget.email }}</p>
            </div>
            <button @click="rejectTarget = null" class="text-gray-400 hover:text-white transition-colors text-xl leading-none">✕</button>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-300">Motivo (opcional)</label>
            <textarea
              v-model="rejectReason"
              rows="3"
              placeholder="Ex: Não reconhecemos este e-mail..."
              class="w-full px-4 py-2 bg-gray-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            ></textarea>
          </div>

          <div class="flex gap-3 pt-2">
            <button @click="rejectTarget = null" class="flex-1 px-4 py-2 border border-white/10 text-gray-300 rounded-xl text-sm hover:bg-white/5 transition">
              Cancelar
            </button>
            <button
              @click="confirmReject"
              :disabled="saving"
              class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl text-sm transition disabled:opacity-50"
            >
              {{ saving ? 'Salvando...' : 'Confirmar Rejeição' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Solicitacao } from '~/composables/useSolicitacoes'

definePageMeta({
  middleware: 'is-admin'
})

const { profile } = useAuth()
const supabase = useSupabaseClient()
const toast = useToast()
const { pendingCount, loading, fetchPendingCount, fetchSolicitacoes, aprovarSolicitacao, rejeitarSolicitacao } = useSolicitacoes()

const tabs = [
  { label: 'Pendentes', value: 'pendente' },
  { label: 'Aprovadas', value: 'aprovada' },
  { label: 'Rejeitadas', value: 'rejeitada' },
  { label: 'Todas', value: 'todas' },
]

const activeTab = ref('pendente')
const allSolicitacoes = ref<Solicitacao[]>([])
const saving = ref(false)

// Modals
const approveTarget = ref<Solicitacao | null>(null)
const rejectTarget = ref<Solicitacao | null>(null)
const rejectReason = ref('')
const selectedBolaoIds = ref<Set<string>>(new Set())

// Campeonatos ativos for assignment
const campeonatos = ref<any[]>([])

const filteredList = computed(() => {
  if (activeTab.value === 'todas') return allSolicitacoes.value
  return allSolicitacoes.value.filter(s => s.status === activeTab.value)
})

// ── Fetch ──
const loadData = async () => {
  allSolicitacoes.value = await fetchSolicitacoes('todas')
  await fetchPendingCount()
}

const loadCampeonatos = async () => {
  const { data } = await supabase
    .from('campeonatos')
    .select('id, nome, logo_url, apelido_grupo')
    .eq('status', 'ativo')
    .order('created_at', { ascending: false })
  campeonatos.value = data || []
}

// ── Approve ──
const openApproveModal = (sol: Solicitacao) => {
  approveTarget.value = sol
  selectedBolaoIds.value = new Set()
}

const toggleBolao = (id: string) => {
  const next = new Set(selectedBolaoIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedBolaoIds.value = next
}

const confirmApprove = async () => {
  if (!approveTarget.value || !profile.value) return
  saving.value = true
  try {
    await aprovarSolicitacao(
      approveTarget.value,
      [...selectedBolaoIds.value],
      (profile.value as any).id
    )
    toast.success(`${approveTarget.value.nome || approveTarget.value.email} aprovado!`)
    approveTarget.value = null
    await loadData()
  } catch (err: any) {
    toast.error(err.message || 'Erro ao aprovar.')
  } finally {
    saving.value = false
  }
}

// ── Reject ──
const openRejectModal = (sol: Solicitacao) => {
  rejectTarget.value = sol
  rejectReason.value = ''
}

const confirmReject = async () => {
  if (!rejectTarget.value || !profile.value) return
  saving.value = true
  try {
    await rejeitarSolicitacao(
      rejectTarget.value.id,
      (profile.value as any).id,
      rejectReason.value || undefined,
      rejectTarget.value.user_id
    )
    toast.success(`Solicitação de ${rejectTarget.value.nome || rejectTarget.value.email} rejeitada.`)
    rejectTarget.value = null
    await loadData()
  } catch (err: any) {
    toast.error(err.message || 'Erro ao rejeitar.')
  } finally {
    saving.value = false
  }
}

// ── Utils ──
const timeAgo = (dateStr: string) => {
  if (!dateStr) return '—'
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${days}d`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

onMounted(() => {
  loadData()
  loadCampeonatos()
})
</script>
