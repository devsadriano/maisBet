<template>
  <div class="min-h-screen bg-[#0d0d0d] text-[#f1f5f9] relative overflow-hidden">
    <!-- Background Glow -->
    <div class="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[200px] pointer-events-none"></div>

    <!-- Header -->
    <header class="sticky top-0 z-50 backdrop-blur-md bg-[rgba(13,13,13,0.85)] border-b border-white/5 px-4 h-16 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-2xl font-bebas tracking-widest text-brand-500">+</span>
        <span class="text-2xl font-bebas tracking-widest text-white">BET</span>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-400">{{ profile?.nome || '' }}</span>
        <button 
          @click="logout" 
          class="text-xs text-gray-500 hover:text-red-400 transition-colors font-bold uppercase tracking-wider"
        >
          Sair
        </button>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-10 md:py-16 space-y-10 animate-fade-in relative z-10">

      <!-- ═══ STATUS CARD ═══ -->
      <div class="bg-gradient-to-br from-amber-500/10 via-transparent to-brand-500/5 border border-amber-500/20 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
        <!-- Glow -->
        <div class="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <!-- Animated Icon -->
          <div class="relative">
            <div class="w-24 h-24 rounded-3xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shadow-lg animate-pulse-slow">
              <span class="text-5xl">⏳</span>
            </div>
            <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
              <span class="text-xs">🟡</span>
            </div>
          </div>

          <div class="flex-1 text-center md:text-left space-y-3">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full border border-amber-500/20">
              <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span class="text-[10px] font-black uppercase tracking-widest text-amber-400">Em análise</span>
            </div>
            <h1 class="text-3xl md:text-4xl font-bebas text-white tracking-wider">
              SOLICITAÇÃO ENVIADA
            </h1>
            <p class="text-sm text-gray-400 leading-relaxed max-w-md">
              Seu pedido de acesso foi recebido com sucesso! O administrador será notificado e analisará sua solicitação em breve.
            </p>

            <!-- Meta Info -->
            <div class="flex flex-wrap items-center gap-4 pt-2">
              <div v-if="solicitacao" class="flex items-center gap-2 text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Enviado em {{ formatDate(solicitacao.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ EXPLORE SECTION ═══ -->
      <div class="space-y-6">
        <div class="flex items-center gap-4 border-b border-white/10 pb-4">
          <div class="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-xl">🔍</div>
          <div>
            <h2 class="text-2xl font-bebas text-white tracking-widest">ENQUANTO ISSO, EXPLORE</h2>
            <p class="text-xs font-bold uppercase tracking-widest text-gray-500">Conheça o que te espera no +BET</p>
          </div>
        </div>

        <!-- Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <!-- Bolões Ativos -->
          <div class="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4 hover:bg-white/[0.05] transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center text-xl">🏆</div>
              <h3 class="text-lg font-bebas text-white tracking-widest">CAMPEONATOS ATIVOS</h3>
            </div>
            
            <div v-if="loadingCamps" class="py-4 text-center text-gray-500 text-sm animate-pulse">Carregando...</div>
            
            <div v-else-if="campeonatos.length === 0" class="py-4 text-center text-gray-500 text-sm">
              Nenhum campeonato ativo no momento.
            </div>
            
            <div v-else class="space-y-3">
              <div
                v-for="camp in campeonatos"
                :key="camp.id"
                class="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl"
              >
                <img 
                  v-if="camp.logo_url" 
                  :src="camp.logo_url" 
                  :alt="camp.nome" 
                  class="w-8 h-8 object-contain"
                  @error="(e) => (e.target as HTMLImageElement).src = 'https://crests.football-data.org/764.png'"
                />
                <span v-else class="text-2xl">⚽</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-white font-medium truncate">{{ camp.nome }}</p>
                  <p class="text-[10px] text-gray-500 uppercase tracking-wider">{{ camp.season || new Date().getFullYear() }} · {{ camp.max_rodadas }} rodadas</p>
                </div>
                <span class="text-[8px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20 whitespace-nowrap">
                  Após aprovação
                </span>
              </div>
            </div>
          </div>

          <!-- Como Funciona -->
          <div class="space-y-4">
            <!-- Card: Pontuação -->
            <div class="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.05] transition-colors">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-xl">📊</div>
                <h3 class="text-lg font-bebas text-white tracking-widest">COMO FUNCIONA</h3>
              </div>
              <ul class="space-y-2 text-sm text-gray-400">
                <li class="flex gap-2">
                  <span class="text-brand-500 font-bold">»</span>
                  <span>Faça palpites de placar em jogos oficiais</span>
                </li>
                <li class="flex gap-2">
                  <span class="text-brand-500 font-bold">»</span>
                  <span>Acertou o placar exato? <strong class="text-emerald-400">3 pontos</strong></span>
                </li>
                <li class="flex gap-2">
                  <span class="text-brand-500 font-bold">»</span>
                  <span>Acertou o vencedor? <strong class="text-blue-400">1 ponto</strong></span>
                </li>
                <li class="flex gap-2">
                  <span class="text-brand-500 font-bold">»</span>
                  <span>Acompanhe o ranking em tempo real</span>
                </li>
              </ul>
            </div>

            <!-- Card: Premiações -->
            <div class="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.05] transition-colors">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-xl">💰</div>
                <h3 class="text-lg font-bebas text-white tracking-widest">PREMIAÇÕES</h3>
              </div>
              <p class="text-sm text-gray-400 leading-relaxed">
                O primeiro colocado leva a <strong class="text-amber-400">glória</strong> e o prêmio. 
                O último vira o <strong class="text-red-400">Mestre Churrasqueiro</strong> — e assume a punição amigável!
              </p>
            </div>

            <!-- Card: Regulamento -->
            <NuxtLink 
              to="/regras" 
              class="block bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.05] hover:border-brand-500/30 transition-all group"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-xl">📖</div>
                  <div>
                    <h3 class="text-lg font-bebas text-white tracking-widest">REGULAMENTO</h3>
                    <p class="text-xs text-gray-500">Ver regras completas do sistema</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </NuxtLink>
          </div>

        </div>
      </div>

      <!-- ═══ MOTIVATIONAL FOOTER ═══ -->
      <div class="text-center py-8 border-t border-white/5 space-y-3">
        <p class="text-sm text-gray-500 font-medium">
          Você já faz parte. Falta só a <span class="text-brand-400 font-bold">aprovação</span>!
        </p>
        <p class="text-[9px] text-gray-600 font-bold uppercase tracking-[0.4em]">
          +BET — The Official Betting Hub
        </p>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const { profile, user, logout, userStatus } = useAuth()

const solicitacao = ref<any>(null)
const campeonatos = ref<any[]>([])
const loadingCamps = ref(true)

let pollInterval: ReturnType<typeof setInterval> | null = null

// ── Fetch user's pending request ──
const fetchSolicitacao = async () => {
  if (!user.value) return
  const { data } = await supabase
    .from('solicitacoes')
    .select('*')
    .eq('user_id', (user.value as any).sub || (user.value as any).id)
    .eq('tipo', 'acesso_sistema')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (data) solicitacao.value = data
}

// ── Fetch all active campeonatos (read-only) ──
const fetchCampeonatos = async () => {
  loadingCamps.value = true
  const { data } = await supabase
    .from('campeonatos')
    .select('id, nome, logo_url, season, max_rodadas, api_competition_code')
    .eq('status', 'ativo')
    .order('created_at', { ascending: false })
  campeonatos.value = data || []
  loadingCamps.value = false
}

// ── Poll for status change ──
const pollStatus = async () => {
  if (!user.value) return
  const uid = (user.value as any).sub || (user.value as any).id
  const { data } = await supabase
    .from('usuarios')
    .select('status')
    .eq('id', uid)
    .single()
  
  if (data?.status === 'ativo') {
    // Status changed! Reload profile and redirect
    // Force a profile refresh by re-fetching
    window.location.href = '/'
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchSolicitacao()
  fetchCampeonatos()
  // Poll every 30 seconds for status change
  pollInterval = setInterval(pollStatus, 30000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

// SEO
useHead({
  title: '+BET | Aguardando Aprovação',
  meta: [
    { name: 'description', content: 'Sua solicitação de acesso ao +BET está em análise.' }
  ]
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-pulse-slow {
  animation: pulseSlow 3s ease-in-out infinite;
}

@keyframes pulseSlow {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.85; }
}
</style>
