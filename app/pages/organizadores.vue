<template>
  <div class="space-y-10 animate-fade-in relative">
    
    <!-- Header -->
    <header class="flex items-start justify-between border-b border-white/5 pb-8 gap-4">
      <div class="space-y-2 min-w-0">
         <NuxtLink to="/" class="text-brand-400 text-xs font-black uppercase tracking-widest hover:text-brand-300 transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao Início
         </NuxtLink>
         <h1 class="text-4xl md:text-5xl font-bebas text-white tracking-tighter">Organizadores <span class="text-brand-500">das Rodadas</span></h1>
      </div>
      <div class="hidden md:block shrink-0">
         <div class="w-16 h-16 bg-brand-500/10 rounded-2xl border border-brand-500/20 flex items-center justify-center">
            <span class="text-3xl">📋</span>
         </div>
      </div>
    </header>

    <!-- Filtro de Campeonato (Admin apenas) -->
    <div v-if="isAdmin && allCampeonatos.length > 1" class="flex flex-col sm:flex-row sm:items-center gap-3">
      <label class="text-[10px] font-black uppercase tracking-widest text-gray-500 shrink-0">Campeonato:</label>
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 flex-1">
          <button
            v-for="camp in allCampeonatos"
            :key="camp.id"
            @click="selectedCampId = camp.id"
            class="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap"
            :class="selectedCampId === camp.id
              ? 'bg-brand-500/15 border-brand-500/40 text-brand-400'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'"
          >
            <img v-if="camp.logo_url" :src="camp.logo_url" class="w-4 h-4 object-contain shrink-0" />
            <span>{{ camp.nome }}{{ camp.apelido_grupo ? ` — ${camp.apelido_grupo}` : '' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- No Bolao State -->
    <div v-if="!campeonatoSelecionado" class="animate-fade-in-up">
      <BaseCard title="⚠️ Nenhum Bolão Selecionado" class="text-center">
          <div class="py-10">
              <span class="text-6xl mb-6 block drop-shadow-lg">🏟️</span>
              <h2 class="text-3xl font-bebas text-white mb-3 tracking-widest uppercase">Sem bolão ativo</h2>
              <p class="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">Você precisa escolher um campeonato no Lobby antes de poder ver os organizadores.</p>
          </div>
          <template #footer>
              <div class="flex justify-center">
                  <BaseButton variant="brand" @click="$router.push('/')">Ir para o Lobby</BaseButton>
              </div>
          </template>
      </BaseCard>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      
      <!-- Info Header Card -->
      <BaseCard variant="pitch">
        <div class="flex items-center gap-4 mb-4">
          <img v-if="campeonatoSelecionado.logo_url" :src="campeonatoSelecionado.logo_url" class="w-8 h-8 object-contain" />
          <div>
            <h2 class="text-lg font-bebas text-white tracking-widest uppercase">{{ campeonatoSelecionado.nome }}</h2>
            <p v-if="campeonatoSelecionado.apelido_grupo" class="text-[10px] text-amber-400 font-bold uppercase tracking-widest">📎 {{ campeonatoSelecionado.apelido_grupo }}</p>
          </div>
        </div>
        <p class="text-gray-400 leading-relaxed text-sm md:text-base">
          Abaixo está a fila completa de organizadores calculada em tempo real para as próximas rodadas, além do histórico das rodadas passadas. A regra do sistema escolhe automaticamente o participante com 
          <strong>menor número de rodadas organizadas</strong>, desempatando pelo <strong>tempo desde a última organização</strong> e depois pela <strong>ordem alfabética</strong>.
        </p>
      </BaseCard>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 space-y-4">
         <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
         <span class="text-gray-400 text-sm">Carregando histórico dos organizadores...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="auditReport.length === 0" class="py-16 text-center space-y-3 bg-white/5 border border-white/10 rounded-[2.5rem]">
        <span class="text-4xl block">📅</span>
        <h4 class="text-lg font-bebas text-gray-400 tracking-wider">SEM HISTÓRICO DE RODADAS</h4>
        <p class="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
          Nenhuma rodada foi iniciada ou configurada para este campeonato ainda.
        </p>
      </div>

      <!-- List of rounds & full queue -->
      <div v-else class="space-y-8">
        
        <!-- Warning Alert: Dynamic Rotation Explanation -->
        <div class="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-2 animate-fade-in-up">
          <h4 class="text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <span>⚠️</span>
            Aviso sobre a Fila de Organizadores (Regra Dinâmica)
          </h4>
          <p class="text-xs leading-relaxed text-gray-300">
            A ordem de seleção dos organizadores é <strong>dinâmica e calculada em tempo real</strong> pelo sistema com base no histórico de rodadas organizadas:
          </p>
          <ul class="list-disc pl-5 text-[11px] text-gray-400 space-y-1">
            <li><strong>Critério Principal:</strong> Quem organizou menos vezes fica no topo da fila (menor contagem de rodadas organizadas).</li>
            <li><strong>Desempate 1:</strong> Quem organizou há mais tempo passa à frente na fila.</li>
            <li><strong>Desempate 2 (Alfabético):</strong> Ordenação pelo nome caso os critérios anteriores sejam idênticos.</li>
          </ul>
          <p class="text-[11px] leading-relaxed text-amber-400 font-semibold mt-1">
            💡 <strong>Importante:</strong> Se um novo participante entrar no campeonato no meio da temporada, ele iniciará com zero rodadas organizadas e será alocado automaticamente como o próximo na fila para as rodadas futuras ainda não abertas. Da mesma forma, alterações manuais feitas pelo administrador recalcularão o rodízio das próximas rodadas para manter a justiça no campeonato.
          </p>
        </div>

        <!-- Banner de Posição do Usuário ("VOCÊ NA FILA") -->
        <div 
          v-if="minhaPosicao" 
          class="p-5 rounded-2xl bg-gradient-to-r from-brand-500/20 via-brand-500/10 to-transparent border border-brand-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up shadow-lg shadow-brand-500/5"
        >
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-brand-500 text-black flex items-center justify-center font-bebas text-2xl font-black shrink-0 shadow-md">
              #{{ minhaPosicao.posicao_fila }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-brand-500 text-black">Sua Posição</span>
                <span class="text-xs text-brand-400 font-bold">Rodada {{ minhaPosicao.numero_rodada }}</span>
              </div>
              <h4 class="text-sm font-bold text-white mt-1">
                <template v-if="minhaPosicao.posicao_fila === 1">
                  🎯 Você é o organizador atual da Rodada {{ minhaPosicao.numero_rodada }}!
                </template>
                <template v-else>
                  Faltam <strong class="text-brand-400">{{ minhaPosicao.posicao_fila - 1 }}</strong> rodadas para a sua vez de organizar (Rodada {{ minhaPosicao.numero_rodada }}).
                </template>
              </h4>
            </div>
          </div>
          <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-black/40 px-3 py-2 rounded-xl border border-white/5 shrink-0 self-stretch sm:self-auto flex items-center justify-center">
            Organizou {{ minhaPosicao.round_count }}x anteriormente
          </div>
        </div>

        <!-- Upcoming Organizers Section (Fila Completa de Próximas Rodadas) -->
        <div v-if="proximosOrganizadores.length > 0" class="space-y-6 animate-fade-in-up">
          
          <!-- Section Header & Controls -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 class="text-lg font-bebas text-white tracking-widest flex items-center gap-2">
                <span>📅</span>
                FILA COMPLETA DE SELEÇÃO (PRÓXIMAS RODADAS)
              </h3>
              <p class="text-xs text-gray-400">
                Mostrando todos os <strong class="text-brand-400">{{ filteredProximos.length }}</strong> participantes na sequência de rodízio.
              </p>
            </div>

            <!-- Controles: Busca e Alternador de Vista (Grid / Lista) -->
            <div class="flex flex-wrap items-center gap-3">
              <!-- Search Input -->
              <div class="relative flex-1 sm:w-64 min-w-[180px]">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  v-model="searchQueue" 
                  type="text" 
                  placeholder="Buscar na fila..."
                  class="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 outline-none focus:border-brand-500 transition-colors"
                />
                <button 
                  v-if="searchQueue" 
                  @click="searchQueue = ''" 
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <!-- Switcher: Grid vs Lista -->
              <div class="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 shrink-0">
                <button 
                  @click="viewMode = 'grid'" 
                  class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                  :class="viewMode === 'grid' ? 'bg-brand-500 text-black font-bold' : 'text-gray-400 hover:text-white'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Cards</span>
                </button>
                <button 
                  @click="viewMode = 'table'" 
                  class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                  :class="viewMode === 'table' ? 'bg-brand-500 text-black font-bold' : 'text-gray-400 hover:text-white'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span>Lista</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Empty search result -->
          <div v-if="filteredProximos.length === 0" class="py-12 text-center space-y-2 bg-white/5 border border-white/10 rounded-2xl">
            <span class="text-3xl block">🔍</span>
            <p class="text-sm font-bold text-gray-300">Nenhum participante encontrado na fila</p>
            <p class="text-xs text-gray-500">Tente buscar por outro nome ou limpe a pesquisa.</p>
            <button @click="searchQueue = ''" class="mt-2 text-xs text-brand-400 underline hover:text-brand-300 font-bold">Limpar busca</button>
          </div>

          <!-- VISTA 1: GRID DE CARDS (Desktop & Mobile Adaptável) -->
          <div v-else-if="viewMode === 'grid'" class="space-y-6">
            
            <!-- Destaques Top 4 (Em destaque se sem busca) -->
            <div v-if="!searchQueue && top4Organizadores.length > 0" class="space-y-3">
              <div class="text-[10px] font-black uppercase tracking-widest text-brand-400 flex items-center gap-1.5">
                <span>🔥</span>
                <span>PRÓXIMAS 4 RODADAS (EM DESTAQUE)</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div 
                  v-for="round in top4Organizadores" 
                  :key="round.id"
                  class="bg-gradient-to-b border rounded-2xl p-5 flex flex-col items-center justify-between text-center relative overflow-hidden group transition-all duration-300"
                  :class="[
                    round.id === currentUserId 
                      ? 'from-brand-500/20 to-black/60 border-brand-500 shadow-lg shadow-brand-500/10' 
                      : round.posicao_fila === 1 
                      ? 'from-amber-500/15 to-black/60 border-amber-500/40 hover:border-amber-500' 
                      : 'from-white/10 to-white/5 border-white/15 hover:border-white/30'
                  ]"
                >
                  <!-- Badge VOCÊ caso seja o usuário logado -->
                  <span 
                    v-if="round.id === currentUserId"
                    class="absolute top-3 right-3 text-[9px] font-black bg-brand-500 text-black px-2 py-0.5 rounded-md uppercase tracking-widest animate-pulse"
                  >
                    VOCÊ
                  </span>

                  <!-- Badge: Order Position -->
                  <span 
                    class="absolute top-3 left-3 text-[9px] font-black border px-2 py-0.5 rounded-md"
                    :class="round.posicao_fila === 1 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                      : 'bg-white/10 text-gray-300 border-white/20'"
                  >
                    {{ round.posicao_fila === 1 ? 'Atual' : `${round.posicao_fila}º na fila` }}
                  </span>

                  <!-- Round Header -->
                  <span class="font-bebas text-2xl text-white tracking-widest mt-4">RODADA {{ round.numero_rodada }}</span>

                  <!-- Shield/Crest -->
                  <div class="my-4 w-16 h-16 flex items-center justify-center p-1 bg-black/50 rounded-full border border-white/10 shadow-inner transition-transform group-hover:scale-110 duration-300">
                    <img 
                      v-if="round.escudo_url" 
                      :src="round.escudo_url" 
                      class="w-11 h-11 object-contain shrink-0" 
                    />
                    <span v-else class="text-3xl">👤</span>
                  </div>

                  <!-- Participant Info -->
                  <div class="space-y-1 w-full">
                    <p class="text-xs font-black text-white uppercase tracking-wider truncate px-1" :class="round.id === currentUserId ? 'text-brand-400' : ''">
                      {{ round.nome || 'Definindo...' }}
                    </p>
                    <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate px-1">{{ round.time_nome || 'Sem Time' }}</p>
                    <p class="text-[8px] text-gray-500 font-mono mt-1">Organizou {{ round.round_count }}x | Última: R{{ round.last_round || '-' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fila Completa (Do 5º ao N-ésimo ou todos da busca) -->
            <div class="space-y-3">
              <div v-if="!searchQueue && restOrganizadores.length > 0" class="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <span>📋</span>
                <span>DEMAIS ORGANIZADORES DA FILA (DO 5º EM DIANTE)</span>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div 
                  v-for="round in (searchQueue ? filteredProximos : restOrganizadores)" 
                  :key="round.id + '-' + round.numero_rodada"
                  class="bg-white/5 border rounded-xl p-4 flex items-center gap-3 relative overflow-hidden group hover:border-white/20 transition-all"
                  :class="[
                    round.id === currentUserId 
                      ? 'bg-brand-500/10 border-brand-500/50 text-white shadow-md shadow-brand-500/5' 
                      : 'border-white/10 text-gray-300'
                  ]"
                >
                  <!-- Position Badge -->
                  <div 
                    class="w-10 h-10 rounded-xl flex items-center justify-center font-bebas text-lg shrink-0 border"
                    :class="round.id === currentUserId 
                      ? 'bg-brand-500 text-black border-brand-400 font-bold' 
                      : 'bg-white/5 text-gray-400 border-white/10'"
                  >
                    #{{ round.posicao_fila }}
                  </div>

                  <!-- Shield -->
                  <div class="w-10 h-10 rounded-full bg-black/40 border border-white/5 p-1 flex items-center justify-center shrink-0">
                    <img v-if="round.escudo_url" :src="round.escudo_url" class="w-7 h-7 object-contain" />
                    <span v-else class="text-sm">👤</span>
                  </div>

                  <!-- Details -->
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-bold uppercase truncate" :class="round.id === currentUserId ? 'text-brand-400' : 'text-white'">
                        {{ round.nome }}
                      </span>
                      <span v-if="round.id === currentUserId" class="px-1.5 py-0.2 text-[8px] font-black uppercase bg-brand-500 text-black rounded">Você</span>
                    </div>
                    <div class="flex items-center justify-between text-[9px] text-gray-500 font-bold uppercase mt-0.5">
                      <span class="text-amber-400 font-mono">Rodada {{ round.numero_rodada }}</span>
                      <span>{{ round.round_count }}x org</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- VISTA 2: TABELA / LISTA COMPACTA (Ideal para mobile e comparação rápida) -->
          <div v-else-if="viewMode === 'table'" class="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-white/5 border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <th class="px-4 py-3 text-center">Fila</th>
                  <th class="px-4 py-3 text-center">Rodada Prevista</th>
                  <th class="px-4 py-3">Participante</th>
                  <th class="px-4 py-3">Time</th>
                  <th class="px-4 py-3 text-center">Rodadas Anteriores</th>
                  <th class="px-4 py-3 text-center">Última Vez (R#)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5 text-xs">
                <tr 
                  v-for="round in filteredProximos" 
                  :key="round.id + '-table-' + round.numero_rodada"
                  class="transition-colors"
                  :class="[
                    round.id === currentUserId 
                      ? 'bg-brand-500/15 text-white font-bold' 
                      : 'hover:bg-white/[0.03] text-gray-300'
                  ]"
                >
                  <!-- Position -->
                  <td class="px-4 py-3 text-center font-mono font-bold">
                    <span 
                      class="px-2 py-0.5 rounded-md text-[10px]"
                      :class="round.posicao_fila === 1 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                        : round.id === currentUserId 
                        ? 'bg-brand-500 text-black' 
                        : 'bg-white/5 text-gray-400'"
                    >
                      #{{ round.posicao_fila }}
                    </span>
                  </td>

                  <!-- Predicted Round -->
                  <td class="px-4 py-3 text-center font-bebas text-base tracking-wider text-amber-400">
                    RODADA {{ round.numero_rodada }}
                  </td>

                  <!-- Participant Name -->
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span class="uppercase font-bold tracking-wide" :class="round.id === currentUserId ? 'text-brand-400' : 'text-white'">
                        {{ round.nome }}
                      </span>
                      <span v-if="round.id === currentUserId" class="px-2 py-0.5 text-[8px] font-black uppercase bg-brand-500 text-black rounded-full">
                        VOCÊ
                      </span>
                      <span v-if="round.posicao_fila === 1" class="px-2 py-0.5 text-[8px] font-black uppercase bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                        Atual
                      </span>
                    </div>
                  </td>

                  <!-- Team -->
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <img v-if="round.escudo_url" :src="round.escudo_url" class="w-4 h-4 object-contain shrink-0" />
                      <span class="text-gray-400">{{ round.time_nome || 'Sem Time' }}</span>
                    </div>
                  </td>

                  <!-- Round Count -->
                  <td class="px-4 py-3 text-center font-mono font-bold text-gray-300">
                    {{ round.round_count }}
                  </td>

                  <!-- Last Round -->
                  <td class="px-4 py-3 text-center font-mono text-gray-400">
                    {{ round.last_round ? `R${round.last_round}` : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        <!-- Filter and controls for Historical Report -->
        <div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 mt-8">
          <span class="text-xs font-bold text-gray-400">Histórico de rodadas criadas: <strong class="text-white">{{ auditReport.length }}</strong></span>
          <div class="flex items-center gap-2">
            <button 
              @click="onlyManual = !onlyManual"
              class="text-xs px-3 py-1.5 rounded-lg border transition-all font-bold"
              :class="onlyManual ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'"
            >
              ⚠️ Ver apenas escolhas manuais
            </button>
          </div>
        </div>

        <!-- Historical Audit List -->
        <div 
          v-for="round in filteredReport" 
          :key="round.id"
          class="border rounded-2xl overflow-hidden transition-all duration-300"
          :class="expandedRounds.has(round.id) ? 'bg-white/5 border-white/20' : 'bg-white/[0.02] border-white/5 hover:border-white/10'"
        >
          <!-- Round Summary Clickable Header -->
          <div 
            @click="toggleRound(round.id)"
            class="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none"
          >
            <div class="flex items-center gap-4">
              <!-- Round number badge -->
              <div class="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-bebas text-2xl shrink-0">
                R{{ round.numero_rodada }}
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                  Organizador: <span class="text-brand-400">{{ round.organizer?.nome || 'Nenhum' }}</span>
                </h3>
                <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                  Participantes na rodada: <strong class="text-gray-300">{{ round.total_participants }}</strong> | {{ formatDate(round.created_at) }}
                </p>
              </div>
            </div>

            <!-- Compliance Status Badges and Accordion Arrow -->
            <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t border-white/5 pt-3 md:pt-0 md:border-0">
              <span 
                v-if="round.rule_followed"
                class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              >
                ✓ Regra Oficial
              </span>
              <span 
                v-else
                class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30"
                title="O organizador foi definido manualmente pelo administrador"
              >
                ⚠️ Escolha Manual
              </span>

              <!-- Arrow -->
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                class="h-5 w-5 text-gray-500 transition-transform duration-300"
                :class="expandedRounds.has(round.id) ? 'rotate-180 text-white' : ''"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <!-- Round Candidates Expanded Table -->
          <div 
            v-if="expandedRounds.has(round.id)"
            class="border-t border-white/10 bg-black/35 p-6 animate-fade-in-up"
          >
            <div class="mb-4">
              <h4 class="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">Critério de Seleção Histórica</h4>
              <p class="text-[10px] text-gray-500 leading-relaxed">
                Tabela ordenada de candidatos no momento da criação da rodada. O candidato na primeira linha (Rank 1) é o selecionado por padrão.
              </p>
            </div>

            <div class="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-white/5 border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <th class="px-4 py-3 text-center">Rank</th>
                    <th class="px-4 py-3">Participante</th>
                    <th class="px-4 py-3">Time do Coração</th>
                    <th class="px-4 py-3 text-center">Rodadas Anteriores</th>
                    <th class="px-4 py-3 text-center">Última Vez (R#)</th>
                    <th class="px-4 py-3 text-center">Resultado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 text-xs text-gray-300">
                  <tr 
                    v-for="(candidate, index) in round.candidates" 
                    :key="candidate.id"
                    class="transition-colors"
                    :class="candidate.is_organizer 
                      ? 'bg-brand-500/10 text-white font-bold' 
                      : 'hover:bg-white/[0.02]'"
                  >
                    <!-- Rank -->
                    <td class="px-4 py-3 text-center font-mono font-bold" :class="index === 0 ? 'text-brand-400' : ''">
                      {{ Number(index) + 1 }}
                    </td>

                    <!-- Participant Name/Email -->
                    <td class="px-4 py-3">
                      <div class="flex flex-col">
                        <span class="uppercase tracking-wide">{{ candidate.nome }}</span>
                        <span class="text-[9px] text-gray-500 font-normal lowercase">{{ candidate.email }}</span>
                      </div>
                    </td>

                    <!-- Team Name -->
                    <td class="px-4 py-3 font-semibold text-gray-400 dark:text-gray-300">
                      {{ candidate.time_nome }}
                    </td>

                    <!-- Total rounds organized before -->
                    <td class="px-4 py-3 text-center font-mono">
                      {{ candidate.round_count }}
                    </td>

                    <!-- Last round organized before -->
                    <td class="px-4 py-3 text-center font-mono">
                      {{ candidate.last_round || '-' }}
                    </td>

                    <!-- Selected badge -->
                    <td class="px-4 py-3 text-center">
                      <span 
                        v-if="candidate.is_organizer"
                        class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-brand-500 text-black dark:text-white"
                      >
                        Selecionado
                      </span>
                      <span v-else class="text-gray-600">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import BaseCard from '~/components/ui/BaseCard.vue'
import BaseButton from '~/components/ui/BaseButton.vue'
import { useCampeonato } from '~/composables/useCampeonato'
import { useAuth } from '~/composables/useAuth'

const { campeonatoAtivo } = useCampeonato()
const supabase = useSupabaseClient()
const { user, profile, isAdmin } = useAuth()

const currentUserId = computed(() => profile.value?.id || user.value?.id)

const loading = ref(false)
const auditReport = ref<any[]>([])
const expandedRounds = ref<Set<string>>(new Set())
const onlyManual = ref(false)

// Controls for upcoming queue display
const viewMode = ref<'grid' | 'table'>('grid')
const searchQueue = ref('')

// Campeonatos para filtro (admin)
const allCampeonatos = ref<any[]>([])
const selectedCampId = ref<string>('')

// Campeonato exibido: se admin e selecionou um, usa esse; senão usa o ativo global
const campeonatoSelecionado = computed(() => {
  if (isAdmin.value && selectedCampId.value) {
    return allCampeonatos.value.find(c => c.id === selectedCampId.value) || campeonatoAtivo.value
  }
  return campeonatoAtivo.value
})

const loadCampeonatos = async () => {
  if (!isAdmin.value) return
  const { data } = await supabase
    .from('campeonatos')
    .select('id, nome, logo_url, apelido_grupo, status')
    .order('created_at', { ascending: false })
  allCampeonatos.value = data || []

  // Pré-selecionar o campeonato ativo, ou o primeiro da lista
  if (!selectedCampId.value) {
    selectedCampId.value = campeonatoAtivo.value?.id || allCampeonatos.value[0]?.id || ''
  }
}

const fetchReport = async () => {
  const campId = campeonatoSelecionado.value?.id
  if (!campId) return
  loading.value = true
  auditReport.value = []
  try {
    const data = await $fetch<{ auditReport: any[] }>('/api/app/organizadores', {
      query: { campeonato_id: campId }
    })
    auditReport.value = data.auditReport || []

    // Auto expand the active/upcoming round (where status is 'aguardando_escolha' or 'aberta')
    const activeRound = auditReport.value.find((r: any) => r.status === 'aguardando_escolha' || r.status === 'aberta')
    if (activeRound) {
      expandedRounds.value = new Set([activeRound.id])
    }
  } catch (err) {
    console.error('Erro ao buscar organizadores:', err)
  } finally {
    loading.value = false
  }
}

const toggleRound = (id: string) => {
  const newSet = new Set(expandedRounds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  expandedRounds.value = newSet
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const filteredReport = computed(() => {
  let list = [...auditReport.value]
  if (onlyManual.value) {
    list = list.filter(r => !r.rule_followed)
  }
  return list.reverse()
})

// FULL list of upcoming organizers for all future rounds (WITHOUT .slice(0, 4) restriction)
const proximosOrganizadores = computed(() => {
  const activeRound = auditReport.value.find((r: any) => r.status === 'aguardando_escolha' || r.status === 'aberta') 
    || auditReport.value[auditReport.value.length - 1]

  if (!activeRound || !activeRound.candidates) return []

  const baseRoundNum = activeRound.numero_rodada

  return activeRound.candidates.map((c: any, index: number) => {
    return {
      id: c.id,
      nome: c.nome,
      email: c.email,
      time_nome: c.time_nome,
      escudo_url: c.escudo_url,
      round_count: c.round_count,
      last_round: c.last_round,
      numero_rodada: baseRoundNum + index,
      posicao_fila: index + 1
    }
  })
})

// Destaque dos 4 primeiros organizadores da fila
const top4Organizadores = computed(() => {
  return proximosOrganizadores.value.slice(0, 4)
})

// Demais organizadores a partir da 5ª posição
const restOrganizadores = computed(() => {
  return proximosOrganizadores.value.slice(4)
})

// Fila filtrada por busca do usuário
const filteredProximos = computed(() => {
  if (!searchQueue.value.trim()) {
    return proximosOrganizadores.value
  }
  const q = searchQueue.value.toLowerCase().trim()
  return proximosOrganizadores.value.filter((p: any) => {
    return (p.nome && p.nome.toLowerCase().includes(q)) || 
           (p.time_nome && p.time_nome.toLowerCase().includes(q)) ||
           (p.email && p.email.toLowerCase().includes(q)) ||
           (String(p.numero_rodada).includes(q))
  })
})

// Posição na fila do usuário logado
const minhaPosicao = computed(() => {
  if (!currentUserId.value) return null
  return proximosOrganizadores.value.find((p: any) => p.id === currentUserId.value) || null
})

// Recarrega ao trocar campeonato (admin)
watch(selectedCampId, () => {
  expandedRounds.value = new Set()
  fetchReport()
})

// Recarrega ao trocar campeonato ativo global (usuário normal)
watch(() => campeonatoAtivo.value?.id, (newId) => {
  if (!isAdmin.value && newId) {
    fetchReport()
  }
}, { immediate: true })

onMounted(async () => {
  await loadCampeonatos()
  // Para admin, disparar o fetch após carregar os campeonatos
  if (isAdmin.value) {
    fetchReport()
  }
})

useHead({
  title: 'Organizadores das Rodadas | +BET',
  meta: [
    { name: 'description', content: 'Histórico e fila completa de organizadores de cada rodada do bolão.' }
  ]
})
</script>
