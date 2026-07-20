<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bebas tracking-wider text-white">Central de Pedidos</h1>
        <p class="text-sm text-gray-400 mt-1">Gerencie as solicitações de acesso ao sistema e aos bolões.</p>
      </div>
      <NuxtLink to="/admin" class="text-xs px-4 py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 font-bold rounded-xl transition-all border border-brand-500/20 hover:border-brand-500/40 uppercase tracking-wider active:scale-95 shrink-0 mt-1">
        ← Voltar
      </NuxtLink>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-white/10 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="activeTab = tab.value; filterCampeonatoId = ''"
        class="relative flex items-center justify-center gap-1.5 shrink-0 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 -mb-px whitespace-nowrap"
        :class="activeTab === tab.value
          ? 'text-brand-400 border-brand-500 bg-brand-500/10'
          : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'"
      >
        {{ tab.label }}
        <span v-if="tab.value === 'pendente' && pendingCount > 0" class="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full min-w-[18px] inline-flex items-center justify-center leading-none">
          {{ pendingCount }}
        </span>
      </button>
    </div>

    <!-- Campeonato Filter -->
    <div v-if="!loading" class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <label class="text-[10px] font-black uppercase tracking-widest text-gray-500 shrink-0">Filtrar:</label>
      <div class="flex items-center gap-2 min-w-0 w-full sm:w-auto">
        <BaseSelect
          v-model="filterCampeonatoId"
          :options="[
            { value: '', label: 'Todos' },
            { value: '__sistema__', label: '🔑 Apenas Sistema' },
            ...campeonatos.map(camp => ({ value: camp.id, label: `⚽ ${camp.nome}${camp.apelido_grupo ? ' — ' + camp.apelido_grupo : ''}` }))
          ]"
          variant="brand"
        />
        <span v-if="filterCampeonatoId" class="text-xs text-gray-500 shrink-0">
          {{ filteredList.length }} resultado(s)
        </span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-16 text-center text-gray-400 text-sm animate-pulse">
      Carregando solicitações...
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredList.length === 0" class="py-16 text-center space-y-4">
      <span class="text-5xl block opacity-50">💭</span>
      <h3 class="text-xl font-bebas text-gray-500 tracking-widest">Nenhuma solicitação {{ activeTab !== 'todas' ? activeTab : '' }}</h3>
    </div>

    <!-- Cards -->
    <div v-else class="space-y-4">
      <div
        v-for="sol in filteredList"
        :key="sol.id"
        class="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4 hover:bg-white/[0.07] transition-colors overflow-hidden"
      >
        <!-- Header -->
        <div class="flex flex-col gap-3">
          <!-- Top row: avatar + name + type badge -->
          <div class="flex items-start gap-3">
            <!-- Avatar -->
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-500/20 flex items-center justify-center text-lg sm:text-xl font-bebas text-brand-400 shrink-0">
              {{ (sol.nome || sol.email || '?').charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-white font-semibold truncate max-w-[160px] sm:max-w-none">{{ sol.nome || sol.email }}</p>
                <!-- Type Badge -->
                <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shrink-0"
                      :class="sol.tipo === 'acesso_sistema'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'">
                  {{ sol.tipo === 'acesso_sistema' ? '🔑 Sistema' : '⚽ Bolão' }}
                </span>
              </div>
              <p class="text-xs text-gray-400 truncate">{{ sol.email }}</p>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                <span v-if="sol.telefone" class="text-[10px] text-gray-500">📞 {{ sol.telefone }}</span>
                <span v-if="sol.cidade || sol.estado" class="text-[10px] text-gray-500">📍 {{ sol.cidade }}{{ sol.cidade && sol.estado ? ' - ' : '' }}{{ sol.estado }}</span>
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
          </div>
        </div>

        <!-- Bolão / Campeonato Info (for acesso_bolao) -->
        <div v-if="sol.tipo === 'acesso_bolao'" class="flex flex-wrap items-center gap-2 px-3 py-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
          <span class="text-[10px] font-black uppercase tracking-widest text-purple-400 shrink-0">⚽ Campeonato</span>
          <div v-if="sol.campeonato" class="flex items-center gap-2 min-w-0 flex-1">
            <img v-if="sol.campeonato.logo_url" :src="sol.campeonato.logo_url" class="w-5 h-5 object-contain shrink-0" />
            <span class="text-sm text-white font-semibold truncate min-w-0">{{ sol.campeonato.nome }}</span>
            <span v-if="sol.campeonato.apelido_grupo" class="text-[10px] text-amber-400 font-bold shrink-0 truncate max-w-[80px]">📎 {{ sol.campeonato.apelido_grupo }}</span>
          </div>
          <span v-else class="text-sm text-gray-500 italic">Campeonato não encontrado</span>
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
        <div class="flex items-center justify-between gap-3 pt-2 border-t border-white/5 flex-wrap">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider">
            {{ timeAgo(sol.created_at) }}
            <span v-if="sol.resolved_at"> · Resolvido {{ timeAgo(sol.resolved_at) }}</span>
          </span>
          
          <!-- Actions (only for pending) -->
          <div v-if="sol.status === 'pendente'" class="flex items-center gap-2">
            <button
              @click="openRejectModal(sol)"
              class="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-colors active:scale-95"
            >
              Rejeitar
            </button>
            <button
              @click="openApproveModal(sol)"
              class="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition-colors active:scale-95"
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
import BaseSelect from '~/components/ui/BaseSelect.vue'
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
const filterCampeonatoId = ref('')

// Modals
const approveTarget = ref<Solicitacao | null>(null)
const rejectTarget = ref<Solicitacao | null>(null)
const rejectReason = ref('')
const selectedBolaoIds = ref<Set<string>>(new Set())

// Campeonatos ativos for assignment
const campeonatos = ref<any[]>([])

// Campeonatos that actually appear in the current tab's list (for filter pills)
const campeonatosNoFiltro = computed(() => {
  const base = activeTab.value === 'todas'
    ? allSolicitacoes.value
    : allSolicitacoes.value.filter(s => s.status === activeTab.value)

  const seen = new Map<string, any>()
  base.forEach(s => {
    if (s.tipo === 'acesso_bolao' && s.campeonato && !seen.has(s.campeonato.id)) {
      seen.set(s.campeonato.id, s.campeonato)
    }
  })
  return [...seen.values()]
})

const filteredList = computed(() => {
  const byTab = activeTab.value === 'todas'
    ? allSolicitacoes.value
    : allSolicitacoes.value.filter(s => s.status === activeTab.value)

  if (!filterCampeonatoId.value) return byTab
  if (filterCampeonatoId.value === '__sistema__') return byTab.filter(s => s.tipo === 'acesso_sistema')
  // Filtra por campeonato — inclui registros mesmo se o join veio null mas o campeonato_id bate
  return byTab.filter(s =>
    s.tipo === 'acesso_bolao' &&
    (s.campeonato?.id === filterCampeonatoId.value || s.campeonato_id === filterCampeonatoId.value)
  )
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
      rejectTarget.value.user_id,
      rejectTarget.value.tipo   // ← passa o tipo para a função decidir se altera o status
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
