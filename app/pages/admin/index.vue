<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bebas tracking-wider text-white">Painel Admin</h1>
        <p class="text-sm text-gray-400 mt-1">Gerencie as configurações e módulos do +BET.</p>
      </div>
      <NuxtLink to="/" class="text-sm px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-lg transition-colors border border-white/10">
        Ir para o jogo
      </NuxtLink>
    </div>

    <!-- Grid de Módulos Admin -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      
      <!-- Card E-mails -->
      <NuxtLink to="/admin/emails" class="group bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-brand-500/50 transition-all flex flex-col justify-between overflow-hidden relative">
        <div class="absolute -right-6 -bottom-6 text-brand-500/10 group-hover:text-brand-500/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="relative z-10">
          <div class="w-12 h-12 bg-brand-500/20 text-brand-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-500 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div class="text-xl font-sans font-semibold tracking-tight text-white mb-2">Acesso & Convidados</div>
          <p class="text-sm font-sans text-gray-300 leading-relaxed">Gerencie a lista VIP de e-mails autorizados para cadastro no bolão.</p>
        </div>
      </NuxtLink>

      <!-- Card Sincronização -->
      <NuxtLink to="/admin/sync" class="group bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-brand-500/50 transition-all flex flex-col justify-between overflow-hidden relative">
        <div class="absolute -right-6 -bottom-6 text-white/5 group-hover:text-brand-500/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="relative z-10">
          <div class="w-12 h-12 bg-white/10 text-gray-400 group-hover:bg-brand-500 group-hover:text-white rounded-xl flex items-center justify-center mb-4 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
          </div>
          <div class="text-xl font-sans font-semibold tracking-tight text-white mb-2">Sincronização & Jogos</div>
          <p class="text-sm font-sans text-gray-300 leading-relaxed">Puxe times, rodadas e placares direto da API no módulo administrativo.</p>
        </div>
      </NuxtLink>

      <!-- Card Rodadas -->
      <NuxtLink to="/admin/rodadas" class="group bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-brand-500/50 transition-all flex flex-col justify-between overflow-hidden relative">
        <div class="absolute -right-6 -bottom-6 text-white/5 group-hover:text-brand-500/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="relative z-10">
          <div class="w-12 h-12 bg-white/10 text-gray-400 group-hover:bg-brand-500 group-hover:text-white rounded-xl flex items-center justify-center mb-4 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="text-xl font-sans font-semibold tracking-tight text-white mb-2">Gestão de Rodadas</div>
          <p class="text-sm font-sans text-gray-300 leading-relaxed">Controle os prazos e force o status das rodadas do campeonato.</p>
        </div>
      </NuxtLink>

      <!-- Card Campeonatos (NEW) -->
      <NuxtLink to="/admin/campeonatos" class="group bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-brand-500/50 transition-all flex flex-col justify-between overflow-hidden relative">
        <div class="absolute -right-6 -bottom-6 text-white/5 group-hover:text-brand-500/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div class="relative z-10">
          <div class="w-12 h-12 bg-white/10 text-gray-400 group-hover:bg-brand-500 group-hover:text-white rounded-xl flex items-center justify-center mb-4 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div class="text-xl font-sans font-semibold tracking-tight text-white mb-2">Gestão de Campeonatos</div>
          <p class="text-sm font-sans text-gray-300 leading-relaxed">Crie, ative e importe múltiplos torneios (Brasileirão, Copa do Mundo, etc).</p>
        </div>
      </NuxtLink>

      <!-- Card Tabela (Restored) -->
      <button @click="showStandings = true" class="group bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-emerald-500/50 transition-all flex flex-col justify-between overflow-hidden relative text-left">
        <div class="absolute -right-6 -bottom-6 text-white/5 group-hover:text-emerald-500/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
          </svg>
        </div>
        <div class="relative z-10">
          <div class="w-12 h-12 bg-white/10 text-gray-400 group-hover:bg-emerald-500 group-hover:text-white rounded-xl flex items-center justify-center mb-4 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
            </svg>
          </div>
          <div class="text-xl font-sans font-semibold tracking-tight text-white mb-2">Classificação Oficial</div>
          <p class="text-sm font-sans text-gray-300 leading-relaxed">Ver as tabelas atuais ou histórico na API externa.</p>
        </div>
      </button>

    </div>
    
    <!-- Modal Tabela -->
    <BrasileiraoStandings :show="showStandings" :adminMode="true" @close="showStandings = false" />
  </div>
</template>

<script setup lang="ts">
import BrasileiraoStandings from '@/components/BrasileiraoStandings.vue'
import { ref } from 'vue'

definePageMeta({
  middleware: 'is-admin'
})

const showStandings = ref(false)
</script>
