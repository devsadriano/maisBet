<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bebas tracking-wider text-white">E-mails Autorizados</h1>
      <NuxtLink to="/admin" class="text-sm text-brand-400 hover:text-brand-300 font-medium">
        ← Voltar
      </NuxtLink>
    </div>

    <!-- Add Email Form -->
    <div class="bg-white/5 border border-white/10 p-6 rounded-2xl">
      <form @submit.prevent="addEmail" class="flex flex-col sm:flex-row gap-4 items-end mb-8">
        <div class="w-full sm:flex-1">
          <label class="block text-sm font-medium text-gray-300 mb-2">Novo E-mail</label>
          <input
            v-model="newEmail"
            type="email"
            required
            placeholder="email@exemplo.com"
            class="w-full px-4 py-2 bg-gray-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            :disabled="loading"
          />
        </div>
        <div class="w-full sm:flex-1">
          <label class="block text-sm font-medium text-gray-300 mb-2">Referência</label>
          <input
            v-model="newRef"
            type="text"
            placeholder="Ex: João da padaria"
            class="w-full px-4 py-2 bg-gray-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            :disabled="loading"
          />
        </div>
        <button
          type="submit"
          :disabled="loading || !newEmail"
          class="w-full sm:w-auto h-[42px] px-6 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition duration-200 disabled:opacity-50 flex-shrink-0"
        >
          Adicionar
        </button>
      </form>

      <div v-if="successMsg" class="mb-4 p-3 bg-brand-500/20 text-brand-400 text-sm rounded-xl">
        {{ successMsg }}
      </div>
      <div v-if="errorMsg" class="mb-4 p-3 bg-red-500/20 text-red-400 text-sm rounded-xl">
        {{ errorMsg }}
      </div>

      <!-- Filter by Campeonato -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
        <label class="text-[10px] font-black uppercase tracking-widest text-gray-500 shrink-0">Filtrar por campeonato:</label>
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto min-w-0">
          <BaseSelect
            v-model="filterCampeonatoId"
            :options="[
              { value: '', label: 'Todos os campeonatos' },
              ...campeonatos.map(camp => ({ value: camp.id, label: camp.nome + (camp.apelido_grupo ? ' — ' + camp.apelido_grupo : '') }))
            ]"
            variant="brand"
          />
          <div class="flex items-center gap-2 shrink-0">
            <button
              v-if="filterCampeonatoId"
              @click="filterCampeonatoId = ''"
              class="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
            >
              ✕ Limpar
            </button>
            <span v-if="filterCampeonatoId" class="text-xs text-gray-500">
              {{ filteredEmails.length }} resultado(s)
            </span>
          </div>
        </div>
      </div>

      <!-- Emails Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-white/10 text-gray-400 text-sm">
              <th class="py-3 px-2 font-medium">E-mail</th>
              <th class="py-3 px-2 font-medium">Referência</th>
              <th class="py-3 px-2 font-medium text-center">Bolões</th>
              <th class="py-3 px-2 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="fetching" class="border-b border-white/5">
              <td colspan="4" class="py-4 text-center text-sm text-gray-400">Carregando...</td>
            </tr>
            <tr v-else-if="filteredEmails.length === 0" class="border-b border-white/5">
              <td colspan="4" class="py-4 text-center text-sm text-gray-400">
                {{ filterCampeonatoId ? 'Nenhum e-mail com acesso a este campeonato.' : 'Nenhum e-mail autorizado.' }}
              </td>
            </tr>
            <tr
              v-else
              v-for="item in filteredEmails"
              :key="item.id"
              class="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <td class="py-3 px-2 text-white text-sm">{{ item.email }}</td>
              <td class="py-3 px-2 text-gray-400 text-sm">{{ item.nome_ref || '—' }}</td>
              <td class="py-3 px-2 text-center">
                <span class="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full font-medium">
                  {{ accessCountByEmail[item.email] ?? 0 }} bolão(ões)
                </span>
              </td>
              <td class="py-3 px-2 text-right flex items-center justify-end gap-3">
                <button
                  @click="openAccessModal(item)"
                  class="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
                >
                  Gerenciar Bolões
                </button>
                <button
                  @click="removeEmail(item.id, item.email)"
                  class="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  :disabled="loading"
                >
                  Remover
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Access Management Modal -->
    <Teleport to="body">
      <div
        v-if="modalEmail"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div class="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bebas tracking-wider text-white">Acesso aos Bolões</h2>
              <p class="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{{ modalEmail.email }}</p>
            </div>
            <button @click="closeModal" class="text-gray-400 hover:text-white transition-colors text-xl leading-none">✕</button>
          </div>

          <div v-if="loadingModal" class="py-8 text-center text-gray-400 text-sm animate-pulse">
            Carregando campeonatos...
          </div>

          <div v-else-if="campeonatos.length === 0" class="py-8 text-center text-gray-400 text-sm">
            Nenhum campeonato ativo encontrado.
          </div>

          <div v-else class="space-y-3 max-h-72 overflow-y-auto pr-1">
            <label
              v-for="camp in campeonatos"
              :key="camp.id"
              class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
              :class="modalSelectedIds.has(camp.id)
                ? 'bg-brand-500/15 border-brand-500/40 text-white'
                : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'"
            >
              <input
                type="checkbox"
                :value="camp.id"
                :checked="modalSelectedIds.has(camp.id)"
                @change="toggleCamp(camp.id)"
                class="accent-brand-500 w-4 h-4 flex-shrink-0"
              />
              <div class="min-w-0">
                <p class="font-medium text-sm truncate">{{ camp.nome }}</p>
                <p v-if="camp.apelido_grupo" class="text-[10px] text-amber-400 font-bold truncate">📎 {{ camp.apelido_grupo }}</p>
                <p class="text-xs text-gray-500 truncate">{{ camp.api_competition_code || camp.area_name || '—' }}</p>
              </div>
            </label>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              @click="closeModal"
              class="flex-1 px-4 py-2 border border-white/10 text-gray-300 rounded-xl text-sm hover:bg-white/5 transition"
            >
              Cancelar
            </button>
            <button
              @click="saveAccesses"
              :disabled="savingModal"
              class="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl text-sm transition disabled:opacity-50"
            >
              {{ savingModal ? 'Salvando...' : 'Salvar Acessos' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import BaseSelect from '~/components/ui/BaseSelect.vue'

definePageMeta({
  middleware: 'is-admin'
})

const supabase = useSupabaseClient()
const emails = ref<any[]>([])
const fetching = ref(true)
const loading = ref(false)

const newEmail = ref('')
const newRef = ref('')
const errorMsg = ref('')
const successMsg = ref('')

// Map of email -> count of bolão accesses
const accessCountByEmail = reactive<Record<string, number>>({})

// Map of email -> Set of campeonato IDs
const accessCampsByEmail = reactive<Record<string, Set<string>>>({})

// All active campeonatos
const campeonatos = ref<any[]>([])

// Filter by campeonato
const filterCampeonatoId = ref<string>('')

const filteredEmails = computed(() => {
  if (!filterCampeonatoId.value) return emails.value
  return emails.value.filter(item =>
    accessCampsByEmail[item.email]?.has(filterCampeonatoId.value)
  )
})

// Modal state
const modalEmail = ref<{ id: string; email: string } | null>(null)
const modalSelectedIds = ref<Set<string>>(new Set())
const loadingModal = ref(false)
const savingModal = ref(false)

// ─── Fetch ───────────────────────────────────────────────────────────
const fetchEmails = async () => {
  fetching.value = true
  const { data, error } = await supabase
    .from('email_autorizados')
    .select('*')
    .order('autorizado_em', { ascending: false })

  if (!error && data) {
    emails.value = data
    await fetchAccessCounts(data.map((e: any) => e.email))
  }
  fetching.value = false
}

const fetchAccessCounts = async (emailList: string[]) => {
  if (!emailList.length) return
  const { data } = await supabase
    .from('campeonato_acessos')
    .select('email, campeonato_id')
    .in('email', emailList)

  if (data) {
    emailList.forEach(e => {
      accessCountByEmail[e] = 0
      accessCampsByEmail[e] = new Set()
    })
    data.forEach((row: any) => {
      accessCountByEmail[row.email] = (accessCountByEmail[row.email] || 0) + 1
      accessCampsByEmail[row.email]?.add(row.campeonato_id)
    })
  }
}

const fetchCampeonatos = async () => {
  const { data } = await supabase
    .from('campeonatos')
    .select('id, nome, api_competition_code, area_name, apelido_grupo')
    .eq('status', 'ativo')
    .order('created_at', { ascending: false })
  campeonatos.value = data || []
}

// ─── Add / Remove email ──────────────────────────────────────────────
const addEmail = async () => {
  if (!newEmail.value) return
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  const { data, error } = await (supabase as any)
    .from('email_autorizados')
    .insert({ email: newEmail.value, nome_ref: newRef.value })
    .select()
    .single()

  if (error) {
    errorMsg.value = error.code === '23505' ? 'Este e-mail já está autorizado.' : error.message
  } else if (data) {
    emails.value.unshift(data)
    accessCountByEmail[data.email] = 0
    successMsg.value = 'E-mail adicionado com sucesso!'
    newEmail.value = ''
    newRef.value = ''
  }

  loading.value = false
  setTimeout(() => successMsg.value = '', 3000)
}

const removeEmail = async (id: string, email: string) => {
  if (!confirm(`Tem certeza que deseja remover o acesso de ${email}?`)) return
  loading.value = true
  errorMsg.value = ''

  // Also remove all campeonato accesses for this email
  await supabase.from('campeonato_acessos').delete().eq('email', email)

  const { error } = await supabase
    .from('email_autorizados')
    .delete()
    .eq('id', id)

  if (error) {
    errorMsg.value = error.message
  } else {
    emails.value = emails.value.filter(e => e.id !== id)
    delete accessCountByEmail[email]
  }

  loading.value = false
}

// ─── Modal ───────────────────────────────────────────────────────────
const openAccessModal = async (item: any) => {
  modalEmail.value = item
  modalSelectedIds.value = new Set()
  loadingModal.value = true

  // Load campeonatos if not yet loaded
  if (campeonatos.value.length === 0) await fetchCampeonatos()

  // Load which campeonatos this email already has access to
  const { data } = await supabase
    .from('campeonato_acessos')
    .select('campeonato_id')
    .eq('email', item.email)

  if (data) {
    modalSelectedIds.value = new Set(data.map((r: any) => r.campeonato_id))
  }

  loadingModal.value = false
}

const closeModal = () => {
  modalEmail.value = null
  modalSelectedIds.value = new Set()
}

const toggleCamp = (campId: string) => {
  const next = new Set(modalSelectedIds.value)
  if (next.has(campId)) next.delete(campId)
  else next.add(campId)
  modalSelectedIds.value = next
}

const saveAccesses = async () => {
  if (!modalEmail.value) return
  savingModal.value = true

  const email = modalEmail.value.email

  // Delete all existing accesses for this email, then re-insert selected
  await supabase.from('campeonato_acessos').delete().eq('email', email)

  const toInsert = [...modalSelectedIds.value].map(campeonato_id => ({ email, campeonato_id }))

  if (toInsert.length > 0) {
    await supabase.from('campeonato_acessos').insert(toInsert)
  }

  // Sincronizar com a Central de Pedidos: aprovar acesso ao sistema se estiver pendente
  await supabase
    .from('solicitacoes')
    .update({ status: 'aprovada', resolved_at: new Date().toISOString() })
    .eq('email', email)
    .eq('tipo', 'acesso_sistema')
    .eq('status', 'pendente')

  // Aprovar pedidos pendentes de acesso aos bolões que acabaram de ser autorizados
  if (toInsert.length > 0) {
    await supabase
      .from('solicitacoes')
      .update({ status: 'aprovada', resolved_at: new Date().toISOString() })
      .eq('email', email)
      .eq('tipo', 'acesso_bolao')
      .eq('status', 'pendente')
      .in('campeonato_id', [...modalSelectedIds.value])
  }

  // Garantir que o usuário seja ativado no sistema, caso exista
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .maybeSingle()
    
  if (usuario) {
    await supabase
      .from('usuarios')
      .update({ status: 'ativo' })
      .eq('id', usuario.id)
  }

  // Atualiza o contador global de pendências
  const { fetchPendingCount } = useSolicitacoes()
  await fetchPendingCount()

  // Update count badge
  accessCountByEmail[email] = toInsert.length

  savingModal.value = false
  closeModal()
}

onMounted(() => {
  fetchEmails()
  fetchCampeonatos()
})
</script>
