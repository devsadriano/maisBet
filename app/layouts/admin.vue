<template>
  <div class="min-h-[100dvh] bg-[#0d0d0d] text-[#f1f5f9] flex flex-col">

    <!-- ───── HEADER ───── -->
    <header class="shrink-0 sticky top-0 z-50 backdrop-blur-md bg-[rgba(13,13,13,0.90)] border-b border-white/5 h-16 flex items-center justify-between px-4 md:px-6">
      <!-- Logo -->
      <NuxtLink to="/admin" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <span class="text-3xl font-bebas tracking-widest text-[var(--brand)]">+</span>
        <span class="text-3xl font-bebas tracking-widest text-white">BET</span>
        <span class="ml-1 px-2 py-0.5 bg-[var(--brand-dim)] border border-[var(--brand)]/30 text-[var(--brand)] text-[9px] font-black uppercase tracking-[0.2em] rounded-lg">ADMIN</span>
      </NuxtLink>

      <!-- Right Side -->
      <div class="flex items-center gap-3">
        <!-- Pending badge -->
        <NuxtLink
          v-if="pendingCount > 0"
          to="/admin/solicitacoes"
          class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-amber-500/20 transition-colors"
        >
          <span class="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
          {{ pendingCount }} pendente{{ pendingCount > 1 ? 's' : '' }}
        </NuxtLink>

        <!-- Ir para o Jogo -->
        <NuxtLink
          to="/"
          class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--brand)]/40 text-gray-400 hover:text-[var(--brand)] rounded-lg text-xs font-black uppercase tracking-wider transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Ir para o jogo
        </NuxtLink>

        <!-- User menu -->
        <div class="relative">
          <button
            @click="toggleDropdown"
            class="flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer select-none"
          >
            <div class="w-9 h-9 rounded-full bg-[var(--brand-dim)] border border-[var(--brand)]/30 flex items-center justify-center">
              <span class="font-bebas text-lg text-[var(--brand)] mt-0.5">A</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 transition-transform duration-200" :class="showDropdown ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown -->
          <div
            class="absolute right-0 pt-2 w-52 z-50 transition-all duration-200 ease-out"
            :class="showDropdown ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 translate-y-2'"
          >
            <div class="bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl py-2">
              <div class="px-4 py-3 border-b border-white/5 mb-1">
                <p class="text-sm font-semibold text-white truncate">{{ profile?.nome || 'Admin' }}</p>
                <p class="text-[10px] text-[var(--brand)] uppercase tracking-wider font-black mt-0.5">Administrador</p>
              </div>
              <NuxtLink to="/" class="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Ir para o Jogo
              </NuxtLink>
              <button @click="logout" class="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- ───── BODY: Sidebar + Content ───── -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Sidebar Desktop -->
      <aside class="hidden md:flex flex-col w-56 shrink-0 border-r border-white/5 bg-[#0b0b0b] overflow-y-auto">
        <nav class="flex-1 p-3 space-y-1">
          <p class="px-3 pt-3 pb-1 text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">Gestão</p>

          <NuxtLink
            to="/admin"
            class="admin-nav-link"
            :class="route.path === '/admin' ? 'admin-nav-active' : 'admin-nav-inactive'"
            @click="closeDropdown"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </NuxtLink>

          <NuxtLink
            to="/admin/rodadas"
            class="admin-nav-link"
            :class="route.path.startsWith('/admin/rodadas') ? 'admin-nav-active' : 'admin-nav-inactive'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Rodadas
          </NuxtLink>

          <NuxtLink
            to="/admin/solicitacoes"
            class="admin-nav-link relative"
            :class="route.path.startsWith('/admin/solicitacoes') ? 'admin-nav-active' : 'admin-nav-inactive'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Solicitações
            <span v-if="pendingCount > 0" class="ml-auto min-w-[18px] h-4.5 px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
              {{ pendingCount }}
            </span>
          </NuxtLink>

          <NuxtLink
            to="/admin/campeonatos"
            class="admin-nav-link"
            :class="route.path.startsWith('/admin/campeonatos') ? 'admin-nav-active' : 'admin-nav-inactive'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Campeonatos
          </NuxtLink>

          <NuxtLink
            to="/admin/emails"
            class="admin-nav-link"
            :class="route.path.startsWith('/admin/emails') ? 'admin-nav-active' : 'admin-nav-inactive'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Acesso &amp; E-mails
          </NuxtLink>

          <div class="pt-3 border-t border-white/5 mt-3 space-y-1">
            <p class="px-3 pb-1 text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">Jogo</p>
            
            <NuxtLink
              to="/"
              class="admin-nav-link"
              :class="route.path === '/' ? 'admin-nav-active' : 'admin-nav-inactive'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Início
            </NuxtLink>

            <NuxtLink
              to="/ranking"
              class="admin-nav-link"
              :class="route.path.startsWith('/ranking') ? 'admin-nav-active' : 'admin-nav-inactive'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Ranking
            </NuxtLink>

            <NuxtLink
              to="/tabela"
              class="admin-nav-link"
              :class="route.path.startsWith('/tabela') ? 'admin-nav-active' : 'admin-nav-inactive'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Tabela
            </NuxtLink>

            <NuxtLink
              to="/regras"
              class="admin-nav-link"
              :class="route.path.startsWith('/regras') ? 'admin-nav-active' : 'admin-nav-inactive'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Regras
            </NuxtLink>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-28 md:pb-8 animate-fade-in">
        <slot />
      </main>
    </div>

    <!-- ───── BOTTOM NAV MOBILE ───── -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-lg bg-[rgba(11,11,11,0.97)] border-t border-white/10 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] flex items-center justify-around px-2 z-50">

      <!-- Dashboard -->
      <NuxtLink to="/admin" class="admin-bottom-link" :class="route.path === '/admin' ? 'text-[var(--brand)]' : 'text-gray-500'">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span>Painel</span>
      </NuxtLink>

      <!-- Rodadas -->
      <NuxtLink to="/admin/rodadas" class="admin-bottom-link" :class="route.path.startsWith('/admin/rodadas') ? 'text-[var(--brand)]' : 'text-gray-500'">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Rodadas</span>
      </NuxtLink>

      <!-- Solicitações -->
      <NuxtLink to="/admin/solicitacoes" class="admin-bottom-link relative" :class="route.path.startsWith('/admin/solicitacoes') ? 'text-[var(--brand)]' : 'text-gray-500'">
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span v-if="pendingCount > 0" class="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">{{ pendingCount }}</span>
        </div>
        <span>Pedidos</span>
      </NuxtLink>

      <!-- Ranking -->
      <NuxtLink to="/ranking" class="admin-bottom-link" :class="route.path.startsWith('/ranking') ? 'text-[var(--brand)]' : 'text-gray-500'">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span>Ranking</span>
      </NuxtLink>

      <!-- Início -->
      <NuxtLink to="/" class="admin-bottom-link" :class="route.path === '/' ? 'text-[var(--brand)]' : 'text-gray-500'">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Início</span>
      </NuxtLink>
    </nav>

    <!-- Toast Global -->
    <BaseToast />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import BaseToast from '~/components/ui/BaseToast.vue'

const { profile, logout, fetchProfile, waitForProfile } = useAuth()
const { isDark, initTheme } = useTheme()
const { pendingCount, fetchPendingCount } = useSolicitacoes()
const route = useRoute()

const showDropdown = ref(false)
const toggleDropdown = (e: Event) => {
  e.stopPropagation()
  showDropdown.value = !showDropdown.value
}
const closeDropdown = () => {
  showDropdown.value = false
}

onMounted(() => {
  initTheme()
  window.addEventListener('click', closeDropdown)
})
onUnmounted(() => {
  window.removeEventListener('click', closeDropdown)
})

await useAsyncData('init-admin-layout', async () => {
  await waitForProfile()
  await fetchPendingCount()
  return true
})
</script>

<style scoped>
.admin-nav-link {
  @apply flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all duration-150 w-full;
}
.admin-nav-active {
  background-color: var(--brand-dim);
  color: var(--brand);
  border: 1px solid rgba(var(--brand-rgb, 34, 197, 94), 0.2);
}
.admin-nav-inactive {
  @apply text-gray-400 hover:bg-white/5 hover:text-white;
}
.admin-bottom-link {
  @apply flex flex-col items-center gap-0.5 transition-all relative px-1.5 py-1 active:scale-90 active:opacity-60 select-none cursor-pointer duration-100;
}
.admin-bottom-link span {
  font-size: 10px !important;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1;
}
</style>
