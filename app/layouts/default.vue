<template>
  <div
    class="min-h-screen transition-colors duration-300"
    :class="isDark
      ? 'bg-[#0d0d0d] text-[#f1f5f9]'
      : 'bg-[#f0fdf4] text-[#111827]'"
  >
    <!-- Navbar Topo -->
    <header
      class="sticky top-0 z-50 backdrop-blur-md border-b px-4 h-16 flex items-center justify-between transition-colors duration-300"
      :class="isDark
        ? 'bg-[rgba(13,13,13,0.85)] border-white/5'
        : 'bg-[rgba(240,253,244,0.85)] border-black/5'"
    >
      <!-- Logo Central/Esquerda -->
      <NuxtLink to="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
        <span class="text-2xl font-bebas tracking-widest text-[var(--brand)]">+</span>
        <span class="text-2xl font-bebas tracking-widest" :class="isDark ? 'text-white' : 'text-gray-900'">BET</span>
      </NuxtLink>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center gap-6 ml-8 mr-auto">
        <NuxtLink
          v-if="!isAdmin"
          to="/palpites"
          class="text-xs font-black uppercase tracking-[0.2em] transition-all hover:text-[var(--brand)] group relative py-1"
          :class="isDark ? 'text-gray-400' : 'text-gray-600'"
          active-class="!text-[var(--brand)]"
        >
          Meus Palpites
          <span class="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--brand)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
        </NuxtLink>
        <NuxtLink
          to="/ranking"
          class="text-xs font-black uppercase tracking-[0.2em] transition-all hover:text-[var(--brand)] group relative py-1"
          :class="isDark ? 'text-gray-400' : 'text-gray-600'"
          active-class="!text-[var(--brand)]"
        >
          Ranking
          <span class="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--brand)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
        </NuxtLink>
        <NuxtLink
          to="/regras"
          class="text-xs font-black uppercase tracking-[0.2em] transition-all hover:text-[var(--brand)] group relative py-1"
          :class="isDark ? 'text-gray-400' : 'text-gray-600'"
          active-class="!text-[var(--brand)]"
        >
          Regras
          <span class="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--brand)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
        </NuxtLink>
        <NuxtLink
          v-if="isAdmin"
          to="/admin"
          class="text-xs font-black uppercase tracking-[0.2em] transition-all hover:text-[var(--brand)] group relative py-1"
          :class="isDark ? 'text-gray-400' : 'text-gray-600'"
          active-class="!text-[var(--brand)]"
        >
          Painel Admin
          <span v-if="adminPendingCount > 0" class="absolute -top-2 -right-5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{{ adminPendingCount }}</span>
          <span class="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--brand)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-2">
        <!-- Status de Bolão Ativo (se estiver em alguma rota de bolão) -->
        <div v-if="campeonatoAtivo && $route.path !== '/'" class="relative group mr-2 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors duration-300" :class="isDark ? 'border-brand-500/30 bg-brand-500/10 text-brand-400' : 'border-brand-600/20 bg-brand-500/5 text-brand-600'">
            <img v-if="campeonatoAtivo.logo_url" :src="campeonatoAtivo.logo_url" alt="Logo Bolão" class="w-5 h-5 object-contain" />
            <span v-else class="text-xl font-bold">🏆</span>
            <span class="text-xs font-black uppercase tracking-widest truncate max-w-[300px]">{{ campeonatoAtivo.nome }}</span>
        </div>

        <!-- Botão Toggle Tema -->
        <button
          @click="toggleTheme"
          :title="isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'"
          class="flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300 group"
          :class="isDark
            ? 'border-white/10 bg-white/5 hover:border-[color:var(--brand)] hover:bg-[var(--brand-dim)]'
            : 'border-black/10 bg-black/5 hover:border-[color:var(--brand)] hover:bg-[var(--brand-dim)]'"
          aria-label="Alternar tema"
        >
          <!-- Ícone Sol (modo claro → clica para escuro) -->
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
          </svg>
          <!-- Ícone Lua (modo escuro → clica para claro) -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
        </button>

        <!-- Avatar / Dropdown de usuário -->
        <div v-if="user" class="relative group">
          <!-- Botão Avatar -->
          <button
            class="relative z-50 flex items-center gap-3 hover:bg-white/5 pl-2 pr-4 py-1.5 rounded-full transition-colors border border-transparent hover:border-white/10"
          >
            <div v-if="currentAcesso?.times?.escudo_url && !isAdmin" class="w-10 h-10 flex flex-col items-center justify-center p-0.5">
              <img :src="currentAcesso.times.escudo_url" alt="Escudo" class="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div v-else class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-inner overflow-hidden">
              <div v-if="isAdmin" class="w-full h-full bg-[var(--brand-dim)] text-[var(--brand)] flex items-center justify-center">
                <span class="font-bebas text-lg mt-0.5">A</span>
              </div>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <div class="absolute right-0 pt-2 w-56 z-50 invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out">
            <div
              class="border rounded-xl shadow-2xl py-2 transition-colors duration-300"
              :class="isDark
                ? 'bg-[#1e1e1e] border-white/10'
                : 'bg-white border-black/8'"
            >
              <!-- User Info Header -->
              <div class="px-4 py-3 border-b mb-2" :class="isDark ? 'border-white/5' : 'border-black/5'">
                <p class="text-sm font-semibold truncate" :class="isDark ? 'text-white' : 'text-gray-900'">{{ profile?.nome || 'Carregando...' }}</p>
                <p v-if="isAdmin" class="text-[10px] text-[var(--brand)] uppercase tracking-wider font-bold mt-1">Administrador</p>
                <p v-else-if="currentAcesso?.times?.nome" class="text-xs text-gray-400 truncate mt-1">Time: <span class="text-gray-300 font-medium">{{ currentAcesso.times.nome }}</span></p>
              </div>

              <!-- Actions -->
              <NuxtLink v-if="isAdmin" to="/admin" class="w-full text-left px-4 py-2 text-sm text-[var(--brand)] hover:bg-white/5 transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Painel Administrativo
              </NuxtLink>
              <button @click="logout" class="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair do sistema
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-fade-in">
      <template v-if="requiresTeamSelection">
        <div class="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <span class="text-4xl animate-bounce">⚠️</span>
          <h2 class="text-3xl font-bebas tracking-widest" :class="isDark ? 'text-white' : 'text-gray-900'">Sua Jornada Começa Aqui</h2>
          <p class="text-sm max-w-sm" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
            Para continuar no +BET, você precisa definir qual é o seu time do coração. <br>
            <span class="text-[var(--brand)] font-bold">ATENÇÃO: Essa escolha é permanente!</span>
          </p>
          <button
            @click="showForcedModal = true"
            class="mt-6 px-8 py-4 font-bold rounded-2xl shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:-translate-y-1 text-white"
            :style="{ backgroundColor: 'var(--brand)' }"
          >
            Escolher Meu Time Oficial
          </button>
        </div>
      </template>
      <slot v-else />
    </main>

    <!-- Navbar Mobile Bottom -->
    <nav
      v-if="!requiresTeamSelection"
      class="md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-lg border-t h-16 flex items-center justify-around px-2 z-50 transition-colors duration-300"
      :class="isDark
        ? 'bg-[rgba(22,22,22,0.92)] border-white/10'
        : 'bg-[rgba(255,255,255,0.92)] border-black/8'"
    >
      <NuxtLink to="/" activeClass="!text-[var(--brand)]" class="flex flex-col items-center gap-1 transition-colors" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span class="text-[10px] font-medium uppercase tracking-wider">Início</span>
      </NuxtLink>

      <NuxtLink v-if="!isAdmin" to="/palpites" activeClass="!text-[var(--brand)]" class="flex flex-col items-center gap-1 transition-colors" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span class="text-[10px] font-medium uppercase tracking-wider">Palpites</span>
      </NuxtLink>

      <NuxtLink to="/ranking" activeClass="!text-[var(--brand)]" class="flex flex-col items-center gap-1 transition-colors" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span class="text-[10px] font-medium uppercase tracking-wider">Ranking</span>
      </NuxtLink>

      <NuxtLink to="/regras" activeClass="!text-[var(--brand)]" class="flex flex-col items-center gap-1 transition-colors" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span class="text-[10px] font-medium uppercase tracking-wider">Regras</span>
      </NuxtLink>

      <NuxtLink v-if="isAdmin" to="/admin" activeClass="!text-[var(--brand)]" class="flex flex-col items-center gap-1 transition-colors relative" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span v-if="adminPendingCount > 0" class="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">{{ adminPendingCount }}</span>
        </div>
        <span class="text-[10px] font-medium uppercase tracking-wider">Admin</span>
      </NuxtLink>

      <!-- Toggle Tema Mobile -->
      <button
        @click="toggleTheme"
        class="flex flex-col items-center gap-1 transition-colors"
        :class="isDark ? 'text-gray-500' : 'text-gray-400'"
        :aria-label="isDark ? 'Modo claro' : 'Modo escuro'"
      >
        <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        </svg>
        <span class="text-[10px] font-medium uppercase tracking-wider">{{ isDark ? 'Claro' : 'Escuro' }}</span>
      </button>
    </nav>

    <!-- Modal Forçado Global -->
    <ModalEscolherTime
      :open="showForcedModal"
      :canClose="false"
      @saved="onTeamSaved"
    />

    <!-- Toast Global -->
    <BaseToast />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import BaseToast from '~/components/ui/BaseToast.vue'

const { profile, user, isAdmin, logout } = useAuth()
const { isDark, toggleTheme, initTheme } = useTheme()
const { campeonatos, campeonatoAtivo, currentAcesso, fetchCampeonatos, selecionarCampeonato } = useCampeonato()
const { pendingCount: adminPendingCount, fetchPendingCount: fetchAdminPendingCount } = useSolicitacoes()

onMounted(() => {
  initTheme()
})

watch(user, async (newUser) => {
  if (newUser) {
    await fetchCampeonatos()
    // Fetch pending count for admin badge
    if (isAdmin.value) {
      await fetchAdminPendingCount()
    }
  }
}, { immediate: true })

const requiresTeamSelection = computed(() => {
  if (!user.value) return false
  if (isAdmin.value) return false
  // Não pede se estivermos fora de um campeonato
  if (!campeonatoAtivo.value) return false 
  // Pede se o acesso desse campeonato ainda não tem time selecionado
  if (currentAcesso.value && !currentAcesso.value.time_id) return true
  
  return false
})

const showForcedModal = ref(false)

const onTeamSaved = () => {
  showForcedModal.value = false
}
</script>
