<template>
  <div class="space-y-8">
    <div v-if="openDropdown" class="fixed inset-0 z-40" @click="openDropdown = null"></div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
      <div>
        <NuxtLink to="/admin" class="text-sm text-gray-400 hover:text-white mb-3 flex items-center gap-1.5 transition-colors group w-fit">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao Painel Admin
        </NuxtLink>
        <h1 class="text-4xl font-bebas tracking-wider text-white mt-1">Gestão de Rodadas</h1>
        <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mt-1">
          <p class="text-sm text-gray-400">Acompanhe e controle o status e prazos das rodadas importadas.</p>
          <div class="h-4 w-px bg-white/20 hidden md:block"></div>
          <button 
            @click="triggerAutoCycle"
            :disabled="isTriggeringCron"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors w-fit cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group" 
            title="Clique para forçar a execução do Auto-Cycle agora"
          >
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span class="text-[10px] text-emerald-400 font-bold uppercase tracking-widest whitespace-nowrap">
              {{ isTriggeringCron ? 'Executando...' : 'Auto-Cycle: ' + (lastCronRun || 'Buscando...') }}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-2 items-start md:items-end w-full md:w-auto relative z-50">
        <label class="text-[10px] uppercase font-black tracking-widest text-gray-500">Filtrar por Campeonato</label>
        
        <!-- Custom Dropdown for Campeonato -->
        <div class="relative w-full md:w-64">
          <button 
            @click="toggleDropdown('camp_filter')"
            class="w-full flex items-center justify-between bg-black/40 border border-white/10 text-white rounded-xl px-4 py-2 outline-none hover:border-brand-500/50 hover:bg-white/[0.04] transition-all text-left group"
            :title="selectedChampionship ? `${selectedChampionship.nome} (${selectedChampionship.season})${selectedChampionship.apelido_grupo ? ' 📎 ' + selectedChampionship.apelido_grupo : ''}` : 'Selecione...'"
          >
            <span class="truncate pr-2 font-medium text-sm">
              <template v-if="selectedChampionship">
                {{ selectedChampionship.nome }} 
                <span class="opacity-60 text-xs">({{ selectedChampionship.season }})</span>
                <span v-if="selectedChampionship.apelido_grupo" class="text-amber-400 ml-1.5 font-bold">
                  📎 {{ selectedChampionship.apelido_grupo }}
                </span>
              </template>
              <template v-else>Selecione...</template>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transition-transform group-hover:text-brand-400 shrink-0" :class="openDropdown === 'camp_filter' ? 'rotate-180 text-brand-400' : 'text-gray-500'" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>

          <div v-if="openDropdown === 'camp_filter'" class="absolute right-0 w-full md:w-[320px] mt-2 bg-pitch-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 animate-fade-in-up z-50 max-h-64 overflow-y-auto custom-scrollbar">
            <button 
              class="w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              @click="selectedChampionshipId = ''; fetchRodadas(); toggleDropdown('camp_filter')"
            >
              <span class="opacity-50 font-mono">-- Selecione... --</span>
            </button>
            <button 
              v-for="c in campeonatosAdmin" :key="c.id"
              class="w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 transition-colors flex items-center justify-between"
              :class="[
                 c.id === selectedChampionshipId ? 'bg-brand-500/10 text-brand-400 font-bold' : 'text-gray-300'
              ]"
              @click="selectedChampionshipId = c.id; fetchRodadas(); toggleDropdown('camp_filter')"
              :title="`${c.nome} (${c.season})${c.apelido_grupo ? ' 📎 ' + c.apelido_grupo : ''}`"
            >
              <span class="truncate flex-1">
                {{ c.nome }} 
                <span class="opacity-60 text-[10px]">({{ c.season }})</span>
                <span v-if="c.apelido_grupo" class="text-amber-400 ml-1.5 text-[10px] font-bold">📎 {{ c.apelido_grupo }}</span>
              </span>
              <span v-if="c.id === selectedChampionshipId" class="text-brand-400 text-[10px] uppercase font-bold tracking-widest shrink-0 ml-2">✔</span>
            </button>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mt-2">
          <button :disabled="!selectedChampionshipId" @click="showStandings = true" class="flex flex-1 md:flex-none justify-center items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all text-emerald-400 font-bold text-sm tracking-wide group active:scale-95 shadow-lg shadow-emerald-500/5 disabled:opacity-50 disabled:cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
            </svg>
            Ver Tabela Oficial
          </button>

          <button :disabled="!selectedChampionshipId" @click="openOrganizerQueueModal" class="flex flex-1 md:flex-none justify-center items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all text-amber-400 font-bold text-sm tracking-wide active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/5" title="Visualizar ordem de todos os próximos organizadores">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Fila Futura de Organizadores
          </button>

          <button :disabled="isRecalculating" @click="recalculateDeadlines" class="flex flex-1 md:flex-none justify-center items-center gap-2 px-5 py-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 hover:border-brand-500/40 transition-all text-brand-400 font-bold text-sm tracking-wide active:scale-95 disabled:opacity-50" :title="`Ajustar prazos para o fuso ${selectedChampionship?.fuso_horario || 'padrão'}`">
            <span v-if="isRecalculating" class="w-4 h-4 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin"></span>
            <span v-else>🕒 Adjust Prazos (Fuso do Bolão)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="campeonatosAdmin.length === 0" class="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.02]">
      <div class="text-5xl mb-4 opacity-30">🏟️</div>
      <p class="text-gray-400 font-medium tracking-wide">Nenhum campeonato cadastrado ainda.</p>
      <p class="text-gray-600 text-sm mt-1">Vá para a Gestão de Campeonatos para criar o primeiro bolão.</p>
    </div>

    <div v-else-if="!selectedChampionshipId" class="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.02]">
      <div class="text-5xl mb-4 opacity-30">🤔</div>
      <p class="text-gray-400 font-medium tracking-wide">Selecione um Campeonato Acima.</p>
    </div>
    
    <div v-else-if="rodadas.length === 0" class="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.02]">
      <div class="text-5xl mb-4 opacity-30">📋</div>
      <p class="text-gray-400 font-medium">Nenhuma rodada importada ainda.</p>
      <p class="text-gray-600 text-sm mt-1">As rodadas são criadas automaticamente pelo sistema ao importar e iniciar.</p>
    </div>

    <!-- Cards Grid -->
    <div v-else class="space-y-4">
      <div
        v-for="r in rodadas"
        :key="r.id"
        class="group bg-white/[0.04] border border-white/10 rounded-3xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
      >
        <!-- Card Top Bar: Round number + status badge -->
        <div class="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-white/5 bg-white/[0.02] rounded-t-3xl gap-2">
          <div class="flex items-center gap-2 sm:gap-4 min-w-0">
            <!-- Round number chip -->
            <div class="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 border border-brand-500/20 shadow-inner shrink-0">
              <span class="font-bebas text-xl sm:text-3xl text-brand-400 leading-none pt-1">#{{ r.numero_rodada }}</span>
            </div>
            <div class="min-w-0">
              <div class="text-white font-bold text-sm sm:text-lg leading-tight flex flex-wrap items-center gap-2">
                Rodada {{ r.numero_rodada }}
                <!-- Status Text Indicator -->
                <div :class="statusClass(r.status)" class="flex items-center gap-1.5 text-[9px] uppercase font-black tracking-widest mt-0.5">
                  <div class="w-1.5 h-1.5 rounded-full shadow-lg" :class="[dotClass(r.status), r.status === 'aberta' ? 'animate-pulse' : '']"></div>
                  {{ formatStatus(r.status) }}
                </div>
              </div>
              <div class="text-brand-400 text-xs font-bold mt-0.5">
                {{ counts[r.id] || 0 }} palpitante(s)
              </div>
            </div>
          </div>
          
          <!-- Actions Group -->
          <div class="flex items-center gap-2 shrink-0">
            <!-- Sincronizar Button -->
            <button 
              @click="syncRound(r)" 
              :disabled="syncingRounds[r.id]"
              class="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/20 transition-all text-orange-400 hover:text-orange-300 font-semibold text-xs tracking-wide active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              title="Sincronizar datas e placares da API externa para esta rodada"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-orange-400" :class="{ 'animate-spin': syncingRounds[r.id] }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span class="hidden md:inline">{{ syncingRounds[r.id] ? 'Sincronizando...' : 'Sincronizar' }}</span>
            </button>

            <!-- Ver Partidas Primary Button -->
            <button @click="openMatchesModal(r)" class="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 hover:border-brand-500/40 hover:bg-brand-500/20 transition-all text-brand-400 hover:text-brand-300 font-semibold text-xs tracking-wide active:scale-95 group shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-brand-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
               <span class="hidden sm:inline">Ver Partidas</span>
            </button>
          </div>
        </div>

        <!-- Card Alert Banner (Calendar Changed) -->
        <div v-if="r.calendario_alterado" class="px-3 sm:px-6 py-3 bg-amber-500/10 border-b border-white/5 flex items-center justify-between gap-4 text-xs">
          <div class="flex items-center gap-2 text-amber-400">
            <span class="text-base shrink-0">⚠️</span>
            <div>
              <span class="font-bold uppercase tracking-wider block mb-0.5 text-[10px]">Alerta de Calendário</span>
              <span class="text-gray-300">A CBF/Organização alterou datas/horários nesta rodada. O Auto-Cycle já reajustou os prazos.</span>
            </div>
          </div>
          <button 
            @click="clearRoundAlert(r)"
            :disabled="clearingAlerts[r.id]"
            class="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold uppercase tracking-wider text-[10px] transition-colors shrink-0 disabled:opacity-50"
          >
            {{ clearingAlerts[r.id] ? 'Limpando...' : 'Entendido' }}
          </button>
        </div>

        <!-- Card Body: 3-column grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5 px-0">

          <!-- Col 1: Organizador -->
          <div class="p-6">
            <div class="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 mb-3">Organizador</div>
            <div v-if="isCopaSelected" class="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center text-xs">
              <span class="text-xl mb-1 block">🌍</span>
              <p class="text-amber-400 font-black uppercase tracking-wider text-[10px]">Formato Copa</p>
              <p class="text-gray-400 mt-1 leading-normal">Sem organizador. Todos os jogos entram para palpite automaticamente.</p>
            </div>
            <template v-else>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center font-bebas text-lg text-brand-400 shrink-0">
                  {{ r.organizador?.nome?.[0]?.toUpperCase() || '?' }}
                </div>
                <div>
                  <div class="text-white font-semibold text-sm leading-tight">{{ r.organizador?.nome || 'Não definido' }}</div>
                  <span v-if="isAtrasado(r)" class="text-[9px] text-red-400 font-black uppercase tracking-widest animate-pulse">⚠️ Prazo Esgotado</span>
                  <span v-else class="text-[10px] text-gray-500">Organizador(a)</span>
                </div>
              </div>
              <!-- Trocar Organizador Customizado -->
              <div v-if="r.status === 'aguardando_escolha' || r.status === 'aberta'" class="mt-4 relative z-50">
                <div class="flex items-center gap-2">
                  <button 
                    @click="toggleDropdown('org-' + r.id)"
                    class="flex-1 min-w-0 flex items-center justify-between bg-white/5 border border-white/10 text-gray-400 text-xs rounded-xl px-3 py-2.5 outline-none hover:border-brand-500/50 hover:bg-white/[0.08] transition-all text-left group"
                  >
                    <span class="truncate" :class="pendingOrganizer[r.id] ? 'text-brand-400 font-bold' : ''">
                      {{ getPendingOrgName(r.id) || '🔄 Trocar Organizador...' }}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transition-transform group-hover:text-brand-400" :class="openDropdown === 'org-' + r.id ? 'rotate-180 text-brand-400' : ''" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button 
                    v-if="pendingOrganizer[r.id] && pendingOrganizer[r.id] !== r.organizer_id"
                    @click="confirmUpdateOrganizer(r.id, pendingOrganizer[r.id] || '')"
                    class="bg-brand-500 hover:bg-brand-400 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-500/20 active:scale-95 shrink-0"
                  >
                    Salvar
                  </button>
                </div>

                <!-- Menu Suspenso Organizador -->
                <div v-if="openDropdown === 'org-' + r.id" class="absolute left-0 w-full mt-2 bg-pitch-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 animate-fade-in-up max-h-48 overflow-y-auto hide-scrollbar z-50">
                  <div class="px-3 pb-1 mb-1 border-b border-white/5 text-[9px] uppercase font-black text-gray-500 tracking-widest">
                    Escolha na lista
                  </div>
                  <button 
                    class="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5"
                    @click="pendingOrganizer[r.id] = ''; toggleDropdown('org-' + r.id)"
                  >
                    <span class="opacity-50 font-mono">-- Cancelar Troca --</span>
                  </button>
                  <button 
                    v-for="u in usuarios" :key="u.id" 
                    :disabled="u.id === r.organizer_id"
                    class="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center justify-between"
                    :class="[
                      u.id === r.organizer_id ? 'text-gray-400 cursor-not-allowed bg-black/20' : 'text-white', 
                      pendingOrganizer[r.id] === u.id ? 'bg-brand-500/10 text-brand-400 font-bold' : ''
                    ]"
                    @click="pendingOrganizer[r.id] = u.id; toggleDropdown('org-' + r.id)"
                  >
                    <span class="truncate max-w-[124px]">{{ u.nome }}</span>
                    <span v-if="u.id === r.organizer_id" class="text-[9px] font-bold uppercase tracking-widest text-gray-500">Atual</span>
                    <span v-if="pendingOrganizer[r.id] === u.id" class="text-brand-400 text-[10px] uppercase font-bold tracking-widest">✔ Sel</span>
                  </button>
                </div>
              </div>
            </template>
          </div>

          <!-- Col 2: Prazos -->
          <div class="p-6">
            <div class="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 mb-3">Prazos de Controle</div>
            <div class="space-y-3">
              <!-- Organizador Deadline -->
              <div v-if="!isCopaSelected" class="flex items-start gap-3 p-3 rounded-xl bg-black/20 border border-white/5" :class="isAtrasado(r) ? 'border-red-500/20 bg-red-500/5' : ''">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" :class="isAtrasado(r) ? 'bg-red-500/20' : 'bg-white/5'">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" :class="isAtrasado(r) ? 'text-red-400' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div>
                  <div class="text-[9px] uppercase font-black tracking-widest mb-0.5" :class="isAtrasado(r) ? 'text-red-400' : 'text-gray-500'">Prazo Organizador</div>
                  <div class="text-xs font-mono" :class="isAtrasado(r) ? 'text-red-300' : 'text-gray-300'">{{ formatDateTime(r.organizer_deadline) }}</div>
                </div>
              </div>
              <!-- Betting Deadline -->
              <div class="flex items-start gap-3 p-3 rounded-xl bg-black/20 border border-white/5">
                <div class="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <div class="text-[9px] uppercase font-black tracking-widest text-brand-500/70 mb-0.5">Prazo dos Palpites</div>
                  <div class="text-xs font-mono text-gray-300">{{ formatDateTime(r.betting_deadline) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Col 3: Controle de Status -->
          <div class="p-6">
            <div class="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 mb-3">Forçar Status</div>
            <p class="text-[11px] text-gray-500 leading-relaxed mb-4">Use apenas em emergências. O sistema gerencia os status automaticamente.</p>
            <!-- Trocar Status Customizado -->
            <div class="relative z-40">
              <div class="flex items-center gap-2">
                <button 
                  @click="toggleDropdown('status-' + r.id)"
                  class="flex-1 min-w-0 flex items-center justify-between bg-white/5 border border-white/10 text-gray-400 text-xs rounded-xl px-3 py-2.5 outline-none hover:border-orange-500/50 hover:bg-white/[0.08] transition-all text-left group"
                >
                  <span class="truncate" :class="pendingStatus[r.id] ? 'text-orange-400 font-bold' : ''">
                    {{ getPendingStatusName(r.id) || '⚙️ Forçar Status...' }}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transition-transform group-hover:text-orange-400" :class="openDropdown === 'status-' + r.id ? 'rotate-180 text-orange-400' : ''" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
                <button 
                  v-if="pendingStatus[r.id] && pendingStatus[r.id] !== r.status"
                  @click="confirmUpdateStatus(r.id, pendingStatus[r.id] || '')"
                  class="bg-orange-500 hover:bg-orange-400 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95 shrink-0"
                >
                  Salvar
                </button>
              </div>

              <!-- Menu Suspenso Status -->
              <div v-if="openDropdown === 'status-' + r.id" class="absolute left-0 bottom-full w-full mb-2 bg-pitch-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 animate-fade-in-up z-50">
                 <button 
                    class="w-full text-left px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5"
                    @click="pendingStatus[r.id] = ''; toggleDropdown('status-' + r.id)"
                  >
                    <span class="opacity-50 font-mono">-- Desfazer --</span>
                  </button>
                  <button 
                    v-for="s in filteredStatusOptions" :key="s.value"
                    class="w-full text-left px-4 py-2 text-xs hover:bg-white/5 transition-colors flex items-center justify-between"
                    :class="[
                       s.value === r.status ? 'text-gray-400 bg-black/20 cursor-not-allowed' : 'text-white',
                       pendingStatus[r.id] === s.value ? 'bg-orange-500/10 text-orange-400 font-bold' : ''
                    ]"
                    :disabled="s.value === r.status"
                    @click="pendingStatus[r.id] = s.value; toggleDropdown('status-' + r.id)"
                  >
                    <span>{{ s.label }}</span>
                    <span v-if="s.value === r.status" class="text-[9px] font-bold uppercase tracking-widest text-gray-500">Atual</span>
                    <span v-if="pendingStatus[r.id] === s.value" class="text-orange-400 text-[10px] uppercase font-bold tracking-widest">✔ Sel</span>
                  </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Partidas -->
    <Teleport to="body">
      <div v-if="selectedRound" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-pitch-900/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-pitch-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">
          <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div>
              <h2 class="text-2xl font-bebas tracking-wider text-white">Rodada {{ selectedRound.numero_rodada }}</h2>
              <p class="text-sm text-gray-400">Visão geral das partidas desta rodada.</p>
            </div>
            <button @click="closeMatchesModal" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="flex-1 overflow-y-auto p-6">
            <div v-if="loadingMatches" class="flex justify-center py-12">
              <div class="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
            </div>
            
            <div v-else-if="roundMatches.length === 0" class="text-center py-12 text-gray-500">
              Nenhuma partida encontrada para esta rodada.
            </div>
            
            <div v-else class="space-y-3">
              <div v-for="match in roundMatches" :key="match.id" class="p-3 sm:p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                  <span v-if="match.is_mandatory" class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-gray-500/20 text-gray-300">Obrigatório</span>
                  <span v-if="match.is_extra" class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-brand-500/20 text-brand-400 border border-brand-500/30">Extra (Org)</span>
                  <span v-if="!match.is_mandatory && !match.is_extra" class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/5 text-gray-500">Regular</span>
                  <span class="text-[10px] text-gray-500 uppercase">{{ formatDateTime(match.data_partida) }}</span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <div class="font-semibold text-white/90 text-sm flex items-center gap-2 flex-1 min-w-0">
                    <span class="truncate text-right flex-1" :title="match.time_casa">{{ match.time_casa }}</span>
                    <div class="flex items-center justify-center bg-black/40 px-2 sm:px-3 py-1 rounded font-bebas tracking-wider text-brand-400 shrink-0">
                      {{ match.gols_casa !== null ? match.gols_casa : '-' }} x {{ match.gols_fora !== null ? match.gols_fora : '-' }}
                    </div>
                    <span class="truncate flex-1" :title="match.time_fora">{{ match.time_fora }}</span>
                  </div>
                  <div class="text-xs font-medium px-2 py-1 rounded bg-black/40 border border-white/5 shrink-0" :class="match.status === 'finalizado' ? 'text-emerald-400' : 'text-gray-400'">
                    {{ match.status }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Fila Futura de Organizadores (Admin) -->
    <Teleport to="body">
      <div v-if="showQueueModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-pitch-900/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-pitch-800 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">
          <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div>
              <h2 class="text-2xl font-bebas tracking-wider text-white flex items-center gap-2">
                <span>📋</span> FILA FUTURA DE ORGANIZADORES
              </h2>
              <p class="text-xs text-gray-400">Sequência calculada de rodízio para as próximas rodadas do campeonato.</p>
            </div>
            <button @click="showQueueModal = false" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-4 border-b border-white/5 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="relative w-full sm:w-72">
              <input 
                v-model="queueSearch" 
                type="text" 
                placeholder="Buscar participante na fila..." 
                class="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 pl-8 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-500"
              />
              <span class="absolute left-2.5 top-2.5 text-gray-500 text-xs">🔍</span>
            </div>
            <NuxtLink to="/organizadores" class="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1">
              <span>Ver Histórico & Auditoria Pública</span> →
            </NuxtLink>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <div v-if="queueLoading" class="flex justify-center py-12">
              <div class="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
            </div>

            <div v-else-if="filteredQueueCandidates.length === 0" class="text-center py-12 text-gray-500 text-xs">
              Nenhum participante encontrado na fila de organizadores.
            </div>

            <div v-else class="space-y-2">
              <div 
                v-for="candidate in filteredQueueCandidates" 
                :key="candidate.id + '-admin-' + candidate.numero_rodada" 
                class="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                :class="candidate.posicao_fila === 1 ? 'border-amber-500/30 bg-amber-500/5' : ''"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <span 
                    class="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0"
                    :class="candidate.posicao_fila === 1 ? 'bg-amber-500 text-black font-black' : 'bg-white/5 text-gray-400 border border-white/10'"
                  >
                    #{{ candidate.posicao_fila }}
                  </span>
                  <img v-if="candidate.escudo_url" :src="candidate.escudo_url" class="w-7 h-7 object-contain shrink-0" />
                  <span v-else class="text-lg shrink-0">👤</span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-white uppercase truncate">{{ candidate.nome }}</span>
                      <span v-if="candidate.posicao_fila === 1" class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Próximo / Atual
                      </span>
                    </div>
                    <div class="text-[10px] text-gray-500 flex items-center gap-2">
                      <span>{{ candidate.time_nome || 'Sem Time' }}</span>
                      <span>•</span>
                      <span class="lowercase">{{ candidate.email }}</span>
                    </div>
                  </div>
                </div>

                <div class="text-right shrink-0">
                  <span class="font-bebas text-sm text-amber-400 block tracking-wider">RODADA {{ candidate.numero_rodada }}</span>
                  <span class="text-[9px] text-gray-500 font-mono">Organizou {{ candidate.round_count }}x | Última: R{{ candidate.last_round || '-' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Tabela do Brasileirão (ou do campeonato selecionado) -->
    <BrasileiraoStandings 
      :show="showStandings" 
      :competitionCode="selectedCompetitionCode" 
      @close="showStandings = false" 
    />
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from '~/composables/useToast'
import BrasileiraoStandings from '~/components/BrasileiraoStandings.vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

definePageMeta({ middleware: 'is-admin', layout: 'admin' })

const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()
const supabase = useSupabaseClient<any>()

// State for Dropdown
const campeonatosAdmin = ref<any[]>([])
const selectedChampionshipId = ref<string>('')

// Computed code for the Standings
const selectedChampionship = computed(() => {
  return campeonatosAdmin.value.find(c => c.id === selectedChampionshipId.value)
})

const selectedCompetitionCode = computed(() => {
  return selectedChampionship.value?.api_competition_code || ''
})

// Auto-detecta se o campeonato selecionado na administração é formato Copa
const isCopaSelected = computed(() => {
  const camp = selectedChampionship.value
  if (!camp) return false
  
  if (camp.formato === 'copa') return true
  if (camp.formato === 'liga') return false

  // Fallbacks
  const COPA_CODES = ['WC', 'EC', 'CAF', 'AFC', 'CONC', 'OFC', 'CAN', 'CLI', 'CWC']
  const COPA_NAME_KEYWORDS = ['world cup', 'copa do mundo', 'copa mundial', 'copa america', 'eurocopa', 'nations cup', 'african cup', 'gold cup', 'continental']

  const code = (camp.api_competition_code || '').toUpperCase()
  if (code && COPA_CODES.some(c => code === c || code.startsWith(c))) return true

  const nome = (camp.nome || '').toLowerCase()
  if (COPA_NAME_KEYWORDS.some(k => nome.includes(k))) return true

  return false
})

const filteredStatusOptions = computed(() => {
  if (isCopaSelected.value) {
    return statusOptions.filter(o => o.value !== 'aguardando_escolha')
  }
  return statusOptions
})

const rodadas = ref<any[]>([])
const usuarios = ref<any[]>([])
const counts = ref<Record<string, number>>({})
const loading = ref(true)
const showStandings = ref(false)

// Modal Fila Futura de Organizadores
const showQueueModal = ref(false)
const queueLoading = ref(false)
const queueCandidates = ref<any[]>([])
const queueSearch = ref('')

async function openOrganizerQueueModal() {
  if (!selectedChampionshipId.value) return
  showQueueModal.value = true
  queueLoading.value = true
  queueCandidates.value = []
  try {
    const data: any = await $fetch('/api/app/organizadores', {
      query: { campeonato_id: selectedChampionshipId.value }
    })
    const report = data.auditReport || []
    const activeRound = report.find((r: any) => r.status === 'aguardando_escolha' || r.status === 'aberta') || report[report.length - 1]
    if (activeRound && activeRound.candidates) {
      queueCandidates.value = activeRound.candidates.map((c: any, index: number) => ({
        id: c.id,
        nome: c.nome,
        email: c.email,
        time_nome: c.time_nome,
        escudo_url: c.escudo_url,
        round_count: c.round_count,
        last_round: c.last_round,
        numero_rodada: activeRound.numero_rodada + index,
        posicao_fila: index + 1
      }))
    }
  } catch (err) {
    console.error('Erro ao buscar fila de organizadores para admin:', err)
  } finally {
    queueLoading.value = false
  }
}

const filteredQueueCandidates = computed(() => {
  if (!queueSearch.value.trim()) return queueCandidates.value
  const q = queueSearch.value.toLowerCase().trim()
  return queueCandidates.value.filter((c: any) => 
    (c.nome && c.nome.toLowerCase().includes(q)) ||
    (c.email && c.email.toLowerCase().includes(q)) ||
    (c.time_nome && c.time_nome.toLowerCase().includes(q)) ||
    (String(c.numero_rodada).includes(q))
  )
})

const lastCronRun = ref<string>('')
const isTriggeringCron = ref(false)

async function triggerAutoCycle() {
  if (isTriggeringCron.value) return
  isTriggeringCron.value = true
  toastInfo('Iniciando Auto-Cycle... Isso pode levar alguns segundos.')
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Não autenticado')

    const response = await fetch('/api/admin/trigger-auto-cycle', {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
    
    if (response.ok) {
       toastSuccess('Auto-Cycle executado com sucesso!')
       await fetchCronStatus()
       await fetchRodadas()
    } else {
       throw new Error('Falha na execução.')
    }
  } catch (error: any) {
    console.error(error)
    toastError('Erro ao executar Auto-Cycle manualmente.')
  } finally {
    isTriggeringCron.value = false
  }
}

const isRecalculating = ref(false)

async function recalculateDeadlines() {
  if (isRecalculating.value) return
  isRecalculating.value = true
  toastInfo('Recalculando prazos no Fuso de Campo Grande MS...')
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Não autenticado.')

    const res: any = await $fetch('/api/admin/recalculate-deadlines', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
    
    if (res.success) {
      toastSuccess(res.message)
      await fetchRodadas()
    }
  } catch (e: any) {
    console.error(e)
    toastError(e.data?.message || 'Erro ao recalcular prazos.')
  } finally {
    isRecalculating.value = false
  }
}

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
    lastCronRun.value = 'Nunca'
  }
}

// Watch championship selection
watch(selectedChampionshipId, () => {
    pendingOrganizer.value = {}
    pendingStatus.value = {}
    fetchRodadas()
    fetchUsuarios()
})

// -- State Menu Dropdowns --
const openDropdown = ref<string | null>(null)
const pendingOrganizer = ref<Record<string, string>>({})
const pendingStatus = ref<Record<string, string>>({})

const statusOptions = [
  { value: 'aguardando_escolha', label: 'Aguardando Organizador' },
  { value: 'aberta', label: 'Palpites Abertos' },
  { value: 'fechada', label: 'Jogos Rolando' },
  { value: 'finalizada', label: 'Finalizada' }
]

function toggleDropdown(id: string) {
  openDropdown.value = openDropdown.value === id ? null : id
}

function getPendingOrgName(rId: string) {
  const orgId = pendingOrganizer.value[rId]
  if (!orgId) return null
  return usuarios.value.find(u => u.id === orgId)?.nome || null
}

function getPendingStatusName(rId: string) {
  const st = pendingStatus.value[rId]
  if (!st) return null
  return statusOptions.find(o => o.value === st)?.label || null
}

async function confirmUpdateOrganizer(id: string, newOrgId: string) {
    if (!newOrgId) return
    await updateOrganizer(id, newOrgId)
    pendingOrganizer.value[id] = ''
}

async function confirmUpdateStatus(id: string, newStatus: string) {
    if (!newStatus) return
    await updateStatus(id, newStatus)
    pendingStatus.value[id] = ''
}

// -- Helpers --
const formatDateTime = (iso: string) => {
  if (!iso) return '-'
  const tz = selectedChampionship.value?.fuso_horario || 'America/Sao_Paulo'
  return new Date(iso).toLocaleString('pt-BR', { 
    timeZone: tz,
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

const formatStatus = (s: string) => {
  const map: Record<string, string> = {
    'aguardando_escolha': 'Aguardando Organizador',
    'aberta': 'Palpites Abertos',
    'fechada': 'Jogos Rolando',
    'finalizada': 'Rodada Concluída'
  }
  return map[s] || s
}

const statusClass = (s: string) => {
  const map: Record<string, string> = {
    'aguardando_escolha': 'text-orange-400/80',
    'aberta': 'text-brand-400',
    'fechada': 'text-gray-400',
    'finalizada': 'text-emerald-400/80'
  }
  return map[s] || 'text-gray-500'
}

const dotClass = (s: string) => {
  const map: Record<string, string> = {
    'aguardando_escolha': 'bg-orange-500 shadow-orange-500/50',
    'aberta': 'bg-brand-500 shadow-brand-500/50',
    'fechada': 'bg-gray-500 shadow-gray-500/50',
    'finalizada': 'bg-emerald-500 shadow-emerald-500/50'
  }
  return map[s] || 'bg-gray-500/50'
}

const isAtrasado = (r: any) => {
  if (r.status !== 'aguardando_escolha') return false
  if (!r.organizer_deadline) return false
  return new Date() > new Date(r.organizer_deadline)
}

// -- Data Loading --
async function fetchCampeonatos() {
  const { data } = await supabase.from('campeonatos').select('*').order('created_at', { ascending: false })
  if (data) {
     campeonatosAdmin.value = data
     // auto-select first one if exists
     if (data.length > 0 && !selectedChampionshipId.value) {
        selectedChampionshipId.value = data[0].id
     }
  }
}

async function fetchRodadas() {
  if (!selectedChampionshipId.value) {
      rodadas.value = []
      loading.value = false
      return
  }

  loading.value = true
  
  // 1. Busca Rodadas do campeonato selecionado
  const { data: roundsData } = await supabase
    .from('rodadas')
    .select('*, organizador:usuarios!organizer_id(nome)')
    .eq('campeonato_id', selectedChampionshipId.value)
    .order('numero_rodada', { ascending: false })
  
  if (roundsData) {
    rodadas.value = roundsData
    
    // 2. Busca contagem de participantes
    const roundIds = roundsData.map((r: any) => r.id)
    if (roundIds.length > 0) {
        const { data: stats } = await supabase
          .from('palpites')
          .select('usuario_id, partidas!inner(rodada_id)')
          .in('partidas.rodada_id', roundIds)

        if (stats) {
           const map: Record<string, Set<string>> = {}
           stats.forEach((s: any) => {
             const rId = s.partidas.rodada_id
             if (!map[rId]) map[rId] = new Set()
             map[rId].add(s.usuario_id)
           })
           
           const finalCounts: Record<string, number> = {}
           Object.keys(map).forEach(rId => {
             const userSet = map[rId]
             if (userSet) finalCounts[rId] = userSet.size
           })
           counts.value = finalCounts
        } else {
           counts.value = {}
        }
    } else {
       counts.value = {}
    }
  }
  
  loading.value = false
}

async function fetchUsuarios() {
  if (!selectedChampionshipId.value) {
    usuarios.value = []
    return
  }

  try {
    // 1. Buscar os emails dos participantes com acesso a este campeonato
    const { data: acessos } = await supabase
      .from('campeonato_acessos')
      .select('email')
      .eq('campeonato_id', selectedChampionshipId.value)

    if (acessos && acessos.length > 0) {
      const emailsList = acessos.map(a => a.email.toLowerCase())
      
      // 2. Buscar usuários correspondentes
      const { data: users } = await supabase
        .from('usuarios')
        .select('id, nome, email, is_admin')
        .in('email', emailsList)
        .order('nome')

      if (users) {
        usuarios.value = users
        return
      }
    }

    // Fallback: se não houver acessos registrados para o campeonato, 
    // busca todos os usuários do sistema (como o banco de dados faz)
    const { data: allUsers } = await supabase
      .from('usuarios')
      .select('id, nome, email, is_admin')
      .order('nome')

    if (allUsers) {
      usuarios.value = allUsers
    }
  } catch (err) {
    console.error('Erro ao buscar usuários do campeonato:', err)
  }
}

onMounted(async () => {
  await fetchCampeonatos()
  if (!selectedChampionshipId.value) {
    loading.value = false
  }
  fetchCronStatus()
})


const syncingRounds = ref<Record<string, boolean>>({})

async function syncRound(round: any) {
  if (syncingRounds.value[round.id]) return
  
  if (!confirm(`Deseja sincronizar as partidas e recalcular os prazos da Rodada ${round.numero_rodada} diretamente da API externa?`)) {
    return
  }
  
  syncingRounds.value[round.id] = true
  toastInfo(`Sincronizando partidas da Rodada ${round.numero_rodada}...`)
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Não autenticado.')

    await $fetch('/api/sync/matches', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: {
        matchday: round.numero_rodada,
        campeonato_id: selectedChampionshipId.value
      }
    })
    
    toastSuccess(`Rodada ${round.numero_rodada} sincronizada com sucesso!`)
    await fetchRodadas()
  } catch (e: any) {
    console.error(e)
    toastError(e.data?.message || 'Erro ao sincronizar rodada.')
  } finally {
    syncingRounds.value[round.id] = false
  }
}

const clearingAlerts = ref<Record<string, boolean>>({})

async function clearRoundAlert(round: any) {
  if (clearingAlerts.value[round.id]) return
  
  clearingAlerts.value[round.id] = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Não autenticado.')

    await $fetch(`/api/admin/rounds/${round.id}/clear-alert`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    toastSuccess('Alerta de alteração limpo com sucesso!')
    await fetchRodadas()
  } catch (e: any) {
    console.error(e)
    toastError(e.data?.message || 'Erro ao limpar alerta.')
  } finally {
    clearingAlerts.value[round.id] = false
  }
}

const selectedRound = ref<any>(null)
const roundMatches = ref<any[]>([])
const loadingMatches = ref(false)

async function openMatchesModal(round: any) {
  selectedRound.value = round
  loadingMatches.value = true
  roundMatches.value = []
  
  const { data } = await supabase
    .from('partidas')
    .select('*')
    .eq('rodada_id', round.id)
    .order('data_partida', { ascending: true })
    
  if (data) {
    roundMatches.value = data
  }
  loadingMatches.value = false
}

function closeMatchesModal() {
  selectedRound.value = null
  roundMatches.value = []
}

async function updateStatus(id: string, newStatus: string) {
  if (!newStatus) return
  if (!confirm(`Tem certeza que deseja forçar o status para '${formatStatus(newStatus)}'?`)) {
    await fetchRodadas() // reload para resetar select
    return
  }
  
  try {
    await $fetch(`/api/admin/rounds/${id}/status`, {
      method: 'PUT',
      body: { status: newStatus }
    })
    await fetchRodadas() // reload
    toastSuccess('Status da rodada atualizado com sucesso!')
  } catch (e: any) {
    console.error(e)
    toastError(e.data?.message || 'Erro ao atualizar status')
  }
}

async function updateOrganizer(id: string, newOrgId: string) {
  if (!newOrgId) return
  const userName = usuarios.value.find(u => u.id === newOrgId)?.nome || 'Usuário'
  
  if (!confirm(`Tem certeza que deseja forçar '${userName}' como o novo organizador desta rodada?`)) {
    await fetchRodadas() // reload para resetar select
    return
  }
  
  try {
    toastInfo('Atualizando organizador...')
    await $fetch(`/api/admin/rounds/${id}/organizer`, {
      method: 'PUT',
      body: { organizer_id: newOrgId }
    })
    await fetchRodadas() // reload
    toastSuccess('Organizador(a) alterado com sucesso!')
  } catch (e: any) {
    console.error(e)
    toastError(e.data?.message || 'Erro ao trocar organizador')
  }
}
</script>
