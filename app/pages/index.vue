<template>
  <div class="space-y-12 pb-20 animate-fade-in">
    
    <!-- 1. PAINEL DO ADMINISTRADOR -->
    <template v-if="isAdmin">
      <!-- 1.1 ADMIN COM BOLÃO ATIVO -->
      <div v-if="campeonatoAtivo" class="space-y-8 animate-fade-in">
        
        <!-- Central do Admin (Hero Card com Info do Bolão e Seletor) -->
        <BaseCard variant="pitch" class="p-6 md:p-8">
          <div v-if="profile" class="space-y-6">
            
            <!-- Banner Topo com Boas-Vindas, Nome do Bolão e Seletor -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div>
                <h1 class="text-2xl md:text-3xl font-bebas tracking-tight text-gray-900 dark:text-white mb-1">
                  PAINEL DO ADMINISTRADOR: <span class="text-danger-400">{{ campeonatoAtivo.nome }}</span>
                </h1>
                <div class="flex items-center gap-2">
                  <div class="h-1.5 w-1.5 rounded-full animate-pulse bg-danger-500"></div>
                  <p class="text-[9px] font-black uppercase tracking-widest text-danger-400">
                    Modo de Gerenciamento Ativo
                  </p>
                </div>
              </div>

              <!-- Seletor de Campeonato Ativo + Botão de Sair -->
              <div class="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto min-w-0">
                <span class="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40 shrink-0">Trocar Bolão:</span>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto min-w-0">
                  <BaseSelect
                    v-model="selectedCampId"
                    :options="activeUserCamps.map(c => ({ value: c.id, label: c.nome + (c.apelido_grupo ? ` (${c.apelido_grupo})` : '') }))"
                    @change="selecionarCampeonato"
                    variant="danger"
                  />
                  <button 
                    @click="selecionarCampeonato('')"
                    class="text-xs px-4 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all active:scale-95 text-center shrink-0 w-full sm:w-auto font-bold"
                  >
                    Sair do Bolão
                  </button>
                </div>
              </div>
            </div>

            <!-- ALERTA DE ALTERAÇÃO DE CALENDÁRIO (Admin) -->
            <div v-if="rodada && rodada.calendario_alterado" class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-amber-400 mb-6 animate-fade-in-up">
              <div class="flex items-center gap-2">
                <span class="text-base shrink-0">⚠️</span>
                <div>
                  <span class="font-bold uppercase tracking-wider block mb-0.5 text-[10px]">Alteração de Calendário Detectada</span>
                  <span class="text-gray-300">A CBF/Organização alterou datas/horários nesta rodada. O Auto-Cycle já reajustou os prazos.</span>
                </div>
              </div>
              <button 
                @click="clearIndexRoundAlert"
                :disabled="clearingIndexAlert"
                class="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold uppercase tracking-wider text-[10px] transition-colors shrink-0 disabled:opacity-50"
              >
                {{ clearingIndexAlert ? 'Limpando...' : 'Entendido' }}
              </button>
            </div>

            <!-- Progresso da Rodada Atual -->
            <div class="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
              <!-- Barra de Progresso do Campeonato -->
              <div class="w-full md:w-1/2 space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <span>Progresso do Torneio</span>
                  <span v-if="rodada && campeonatoAtivo.max_rodadas">Rodada {{ rodada.numero_rodada }} de {{ campeonatoAtivo.max_rodadas }}</span>
                </div>
                <div v-if="rodada && campeonatoAtivo.max_rodadas" class="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                  <div 
                    class="bg-gradient-to-r from-danger-500 to-amber-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                    :style="{ width: `${(rodada.numero_rodada / campeonatoAtivo.max_rodadas) * 100}%` }"
                  />
                </div>
                <div v-else class="text-xs text-gray-500 font-bold uppercase tracking-wide">Sem rodada ativa configurada</div>
              </div>

              <!-- Prazo / Status da Rodada -->
              <div v-if="rodada" class="w-full md:w-auto shrink-0 flex items-center gap-3 bg-danger-500/10 border border-danger-500/20 rounded-full px-5 py-2.5 shadow-inner">
                <div class="w-2 h-2 rounded-full bg-danger-500 animate-pulse"></div>
                <span class="text-[11px] font-black uppercase tracking-widest text-danger-400">
                  Rodada {{ rodada.numero_rodada }} - {{ locked ? 'Fechada' : `Fecha em: ${timeRemaining || 'Calculando...'}` }}
                </span>
              </div>
            </div>

          </div>
          <div v-else class="animate-pulse space-y-6 py-4">
             <div class="h-10 bg-white/5 rounded-xl w-1/2"></div>
             <div class="h-32 bg-white/5 rounded-[2rem]"></div>
          </div>
        </BaseCard>

        <!-- Dashboard Central Grid do Admin -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in-up">
          
          <!-- Coluna Esquerda: Monitoramento de Palpites (8/12) -->
          <div class="lg:col-span-8 space-y-6">
            <div class="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
              
              <!-- Cabeçalho do Monitoramento -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-bebas text-2xl text-white tracking-wider">📊 Monitoramento de Palpites</h3>
                    <button 
                      @click="fetchAdminMonitorData" 
                      :disabled="adminMonitorLoading"
                      class="text-gray-400 hover:text-white transition-all p-1 hover:bg-white/5 rounded-lg flex items-center justify-center shrink-0"
                      title="Atualizar dados"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="{ 'animate-spin': adminMonitorLoading }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    </button>
                  </div>
                  <p class="text-xs text-gray-400 mt-1">Gerencie a participação dos usuários nesta rodada.</p>
                </div>

                <!-- Filtros de Status -->
                <div class="flex flex-wrap items-center gap-1 bg-black/40 rounded-xl p-1 border border-white/5 shrink-0">
                  <button 
                    @click="statusFilter = 'all'"
                    class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                    :class="statusFilter === 'all' ? 'bg-danger-500 text-white' : 'text-gray-400 hover:text-white'"
                  >
                    Todos
                  </button>
                  <button 
                    @click="statusFilter = 'completed'"
                    class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                    :class="statusFilter === 'completed' ? 'bg-danger-500 text-white' : 'text-gray-400 hover:text-white'"
                  >
                    Completos
                  </button>
                  <button 
                    @click="statusFilter = 'pending'"
                    class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                    :class="statusFilter === 'pending' ? 'bg-danger-500 text-white' : 'text-gray-400 hover:text-white'"
                  >
                    Pendentes
                  </button>
                </div>
              </div>

              <!-- Campo de Busca -->
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  v-model="searchQuery"
                  type="text" 
                  placeholder="Buscar participante pelo nome ou e-mail..."
                  class="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold text-white placeholder-gray-500 outline-none focus:border-danger-500 transition-all shadow-inner"
                />
              </div>

              <!-- Estados do Monitor -->
              <div v-if="adminMonitorLoading" class="py-16 text-center space-y-4">
                <div class="w-10 h-10 border-3 border-danger-500/20 border-t-danger-500 rounded-full animate-spin mx-auto"></div>
                <p class="text-danger-400 font-bebas text-lg tracking-wider animate-pulse">Buscando participação dos jogadores...</p>
              </div>

              <div v-else-if="adminMonitorError" class="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                <p class="text-sm font-bold text-red-400">{{ adminMonitorError }}</p>
                <button @click="fetchAdminMonitorData" class="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold rounded-lg transition-colors border border-red-500/30">
                  Tentar novamente
                </button>
              </div>

              <div v-else-if="sortedMatches.length === 0" class="py-16 text-center space-y-3">
                <span class="text-4xl block">📅</span>
                <h4 class="text-lg font-bebas text-gray-400 tracking-wider">SEM JOGOS NA RODADA</h4>
                <p class="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Esta rodada ativa não possui nenhuma partida configurada no momento.
                </p>
              </div>

              <div v-else-if="filteredMonitorUsers.length === 0" class="py-16 text-center space-y-3">
                <span class="text-4xl block">🔍</span>
                <h4 class="text-lg font-bebas text-gray-400 tracking-wider">NENHUM RESULTADO</h4>
                <p class="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Nenhum participante atende aos filtros selecionados.
                </p>
              </div>

              <!-- Lista de Usuários Monitorados -->
              <div v-else class="divide-y divide-white/5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                <div 
                  v-for="item in filteredMonitorUsers" 
                  :key="item.id"
                  class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <!-- Infos do Jogador -->
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bebas text-lg text-white font-bold uppercase select-none">
                      {{ item.nome.charAt(0) }}
                    </div>
                    <div>
                      <h5 class="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                        {{ item.nome }}
                        <span class="text-[9px] font-bold text-gray-500 normal-case">({{ item.time_nome }})</span>
                      </h5>
                      <p class="text-[10px] text-gray-500 truncate max-w-[200px] sm:max-w-none">{{ item.email }}</p>
                    </div>
                  </div>

                  <!-- Progresso de Palpites -->
                  <div class="flex flex-col sm:items-end gap-1.5 flex-grow sm:flex-none sm:min-w-[150px]">
                    <div class="flex justify-between sm:justify-end items-center gap-2 text-[10px] font-bold">
                      <span 
                        class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider"
                        :class="item.palpites_count === sortedMatches.length 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : item.palpites_count > 0 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'"
                      >
                        {{ item.palpites_count === sortedMatches.length 
                          ? 'Completo' 
                          : item.palpites_count > 0 
                          ? 'Incompleto' 
                          : 'Pendente' }}
                      </span>
                      <span class="text-white">{{ item.palpites_count }} de {{ sortedMatches.length }} palpites</span>
                    </div>
                    <div class="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                      <div 
                        class="h-full rounded-full transition-all duration-300"
                        :class="item.palpites_count === sortedMatches.length ? 'bg-emerald-400' : 'bg-danger-400'"
                        :style="{ width: `${(item.palpites_count / sortedMatches.length) * 100}%` }"
                      />
                    </div>
                      <!-- Botões de Ação para cobrar -->
                  <div class="flex items-center gap-2">
                    <!-- WhatsApp Cobrança (Apenas se tiver palpites pendentes) -->
                    <a 
                      v-if="item.palpites_count < sortedMatches.length && item.telefone"
                      :href="getWhatsAppLink(item)"
                      target="_blank"
                      class="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-full transition-all hover:scale-105 shrink-0 flex items-center justify-center"
                      title="Cobrar via WhatsApp"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.18 1.448 4.75 1.45 5.5.003 9.975-4.475 9.978-9.982.001-2.67-1.03-5.183-2.9-7.058C16.545 1.7 14.053.67 11.98.67c-5.5 0-9.978 4.477-9.98 9.983-.001 1.848.48 3.655 1.396 5.23L2.38 21.6l5.728-1.503-1.46.857zm12.353-8.868c-.328-.164-1.94-.96-2.24-1.07-.3-.11-.52-.164-.74.164-.22.328-.85 1.07-1.04 1.29-.19.22-.38.246-.71.082-.33-.164-1.393-.512-2.653-1.636-1-.893-1.676-2-1.874-2.33-.197-.328-.02-.505.143-.67.147-.148.33-.383.493-.574.165-.19.22-.328.328-.547.11-.22.055-.41-.027-.574-.082-.164-.74-1.78-.102-2.16.22-.22.44-.246.66-.246.22 0 .44 0 .66.028.22.028.5.11.76.438.26.328 1 2.44 1.09 2.63.09.19.09.356 0 .52-.09.164-.19.328-.328.493-.164.164-.328.328-.493.438-.19.164-.38.356-.164.71.218.356.97 1.6 2.08 2.585 1.43 1.275 2.63 1.67 3.01 1.86.38.19.6.164.82-.082.22-.246.96-1.07 1.2-1.42.24-.356.5-.3.82-.136.328.164 2.08 1.01 2.44 1.176.356.164.6.246.68.383.082.137.082.8-.246 1.12z"/>
                      </svg>
                    </a>
                    <!-- Copiar Lembrete -->
                    <button 
                      v-if="item.palpites_count < sortedMatches.length"
                      @click="copyReminderText(item)"
                      class="w-10 h-10 bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-full transition-all hover:scale-105 shrink-0 flex items-center justify-center"
                      title="Copiar Lembrete de Cobrança"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </button>
                    <!-- Completo Feedback -->
                    <div 
                      v-else 
                      class="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"
                      title="Palpites concluídos"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Coluna Direita: Atalhos do Painel (4/12) -->
          <div class="lg:col-span-4 space-y-6">
            <div class="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 md:p-8 space-y-6">
              <div>
                <h3 class="font-bebas text-2xl text-white tracking-wider">Atalhos Administrativos</h3>
                <p class="text-xs text-gray-400 mt-1">Gerencie os módulos da plataforma.</p>
              </div>

              <div class="grid grid-cols-1 gap-3">
                <!-- Gerenciar Rodadas -->
                <NuxtLink to="/admin/rodadas" class="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-danger-500/50 transition-all group">
                  <div class="w-10 h-10 rounded-xl bg-danger-500/15 border border-danger-500/20 text-danger-400 flex items-center justify-center group-hover:bg-danger-500 group-hover:text-white transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <span class="text-xs font-black uppercase text-white tracking-wider block">Gestão de Rodadas</span>
                    <span class="text-[10px] text-gray-500">Prazos e partidas da rodada</span>
                  </div>
                </NuxtLink>

                <!-- Gestão de Campeonatos -->
                <NuxtLink to="/admin/campeonatos" class="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-danger-500/50 transition-all group">
                  <div class="w-10 h-10 rounded-xl bg-danger-500/15 border border-danger-500/20 text-danger-400 flex items-center justify-center group-hover:bg-danger-500 group-hover:text-white transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <span class="text-xs font-black uppercase text-white tracking-wider block">Campeonatos</span>
                    <span class="text-[10px] text-gray-500">Ativação, regras e criação</span>
                  </div>
                </NuxtLink>

                <!-- Acesso e Convidados -->
                <NuxtLink to="/admin/emails" class="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-danger-500/50 transition-all group">
                  <div class="w-10 h-10 rounded-xl bg-danger-500/15 border border-danger-500/20 text-danger-400 flex items-center justify-center group-hover:bg-danger-500 group-hover:text-white transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span class="text-xs font-black uppercase text-white tracking-wider block">Acesso & Convidados</span>
                    <span class="text-[10px] text-gray-500">Lista VIP de e-mails autorizados</span>
                  </div>
                </NuxtLink>

                <!-- Central de Pedidos -->
                <NuxtLink to="/admin/solicitacoes" class="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-danger-500/50 transition-all group">
                  <div class="w-10 h-10 rounded-xl bg-danger-500/15 border border-danger-500/20 text-danger-400 flex items-center justify-center group-hover:bg-danger-500 group-hover:text-white transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <span class="text-xs font-black uppercase text-white tracking-wider block">Central de Pedidos</span>
                    <span class="text-[10px] text-gray-500">Análise de solicitações de entrada</span>
                  </div>
                </NuxtLink>

              </div>

            </div>
          </div>

        </div>

      </div>

      <!-- 1.2 ADMIN SEM BOLÃO ATIVO (LOBBY) -->
      <div v-else class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div class="md:col-span-12">
          <BaseCard variant="pitch" class="h-full">
            <div v-if="profile" class="space-y-10">
              <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h1 class="text-2xl md:text-3xl font-bebas tracking-tight text-gray-900 dark:text-white mb-1">
                    E AÍ, <span class="text-danger-400">{{ profile.nome.split(' ')[0] }}</span>!
                  </h1>
                  <div class="flex items-center gap-2">
                    <div class="h-1.5 w-1.5 rounded-full animate-pulse bg-danger-500"></div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-danger-400">
                      Status: Administrador Plataforma
                    </p>
                  </div>
                </div>
              </div>

              <!-- Dashboard Overview Display -->
              <div class="bg-white/[0.03] border border-danger-500/20 p-10 rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-10 relative overflow-hidden group/admin hover:bg-danger-500/5 transition-all">
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-danger-500/20 rounded-full blur-[80px] opacity-0 group-hover/admin:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                
                 <div class="relative group/shield shrink-0">
                   <div class="w-24 h-24 rounded-full bg-danger-500/10 flex items-center justify-center border border-danger-500/30 text-4xl font-bebas text-danger-400 shadow-inner">
                      A
                   </div>
                </div>

                <div class="flex-1 text-center sm:text-left relative z-10 space-y-2">
                  <NuxtLink to="/admin" class="inline-flex items-center gap-2 px-3 py-1 bg-danger-500/10 rounded-full border border-danger-500/20 mb-2 hover:bg-danger-500/30 transition-colors">
                    <span class="text-[9px] font-black uppercase tracking-widest text-danger-400">Master Control</span>
                  </NuxtLink>
                  <h3 class="text-3xl font-bebas text-gray-900 dark:text-white tracking-[0.1em] group-hover/admin:text-danger-400 transition-colors">GERENCIAR BOLÕES</h3>
                  <p class="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500 dark:text-white/50 mt-2 flex items-center justify-center sm:justify-start gap-2">
                     Crie ou edite novos campeonatos para a rede.
                  </p>
                </div>
              </div>
            </div>
            <div v-else class="animate-pulse space-y-6 py-4">
               <div class="h-10 bg-white/5 rounded-xl w-1/2"></div>
               <div class="h-32 bg-white/5 rounded-[2rem]"></div>
            </div>
          </BaseCard>
        </div>
      </div>
    </template>

    <!-- 2. PAINEL DO JOGADOR (Novo Dashboard Vivo e Engajador) -->
    <div v-else class="space-y-8">
      
      <!-- Central do Competidor (Hero Card) -->
      <BaseCard variant="pitch" class="p-6 md:p-8">
        <div v-if="profile" class="space-y-8">
          
          <!-- Banner Topo com Boas-Vindas e Seletor -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <h1 class="text-2xl md:text-3xl font-bebas tracking-tight text-gray-900 dark:text-white mb-1">
                E AÍ, <span class="text-brand-600 dark:text-brand-400">{{ profile.nome.split(' ')[0] }}</span>!
              </h1>
              <div class="flex items-center gap-2">
                <div class="h-1.5 w-1.5 rounded-full animate-pulse bg-emerald-500"></div>
                <p class="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                  Status: Competidor Ativo
                </p>
              </div>
            </div>

            <!-- Seletor de Campeonato Ativo -->
            <div v-if="activeUserCamps.length > 1" class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
              <span class="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40 shrink-0">Visualizar Bolão:</span>
              <BaseSelect
                v-model="selectedCampId"
                :options="activeUserCamps.map(c => ({ value: c.id, label: c.nome + (c.apelido_grupo ? ` (${c.apelido_grupo})` : '') }))"
                @change="selecionarCampeonato"
                variant="brand"
              />
            </div>
          </div>

          <!-- Estatísticas se houver campeonato selecionado -->
          <div v-if="campeonatoAtivo" class="space-y-8 animate-fade-in-up">
            
            <!-- Grid de Resumos -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <!-- Stat 1: Pontuação -->
              <div class="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 p-6 rounded-2xl flex items-center gap-4 transition-all group/stat">
                <div class="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 text-xl border border-brand-500/20 shadow-inner group-hover/stat:scale-110 transition-transform">🎯</div>
                <div>
                  <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Pontuação Total</span>
                  <span class="font-bebas text-3xl text-gray-900 dark:text-white leading-none">
                    {{ userRankingEntry?.total_pontos ?? 0 }} <span class="text-xs uppercase font-black text-gray-500">pts</span>
                  </span>
                </div>
              </div>

              <!-- Stat 2: Classificação -->
              <div class="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 p-6 rounded-2xl flex items-center gap-4 transition-all group/stat">
                <div class="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center text-yellow-400 text-xl border border-gold-500/20 shadow-inner group-hover/stat:scale-110 transition-transform">🏆</div>
                <div>
                  <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Classificação</span>
                  <span class="font-bebas text-3xl text-gray-900 dark:text-white leading-none">
                    {{ userRankingEntry?.position ? `${userRankingEntry.position}º` : '-' }}
                  </span>
                </div>
              </div>

              <!-- Stat 3: Aproveitamento -->
              <div class="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 p-6 rounded-2xl flex items-center gap-4 transition-all group/stat">
                <div class="w-12 h-12 rounded-xl bg-pitch-500/10 flex items-center justify-center text-emerald-400 text-xl border border-pitch-500/20 shadow-inner group-hover/stat:scale-110 transition-transform">📈</div>
                <div>
                  <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Aproveitamento</span>
                  <span class="font-bebas text-3xl text-gray-900 dark:text-white leading-none">
                    {{ userAproveitamento }}%
                  </span>
                </div>
              </div>

              <!-- Stat 4: Tabela Oficial (Link) -->
              <NuxtLink to="/tabela" class="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 p-6 rounded-2xl flex items-center gap-4 transition-all group/stat cursor-pointer hover:border-brand-500/30">
                <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl border border-blue-500/20 shadow-inner group-hover/stat:scale-110 transition-transform">📊</div>
                <div>
                  <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Tabela Oficial</span>
                  <span class="font-bebas text-3xl text-gray-900 dark:text-white leading-none flex items-center gap-1.5">
                    VER <span class="text-xs uppercase font-black text-brand-500 group-hover/stat:underline">TABELA</span>
                  </span>
                </div>
              </NuxtLink>

            </div>

            <!-- ALERTA DE ALTERAÇÃO DE CALENDÁRIO (Competidor) -->
            <div v-if="rodada && rodada.calendario_alterado" class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-400 mb-6 animate-fade-in-up">
              <span class="text-base shrink-0">⚠️</span>
              <div>
                <span class="font-bold uppercase tracking-wider block mb-0.5 text-[10px]">Mudança nos Jogos</span>
                <span class="text-gray-300">Atenção! A organização/CBF alterou datas ou horários dos jogos desta rodada. Verifique os novos horários e fique atento ao novo prazo de palpites!</span>
              </div>
            </div>

            <!-- Progresso e Alerta Regressivo -->
            <div class="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
              <!-- Barra de Progresso -->
              <div class="w-full md:w-1/2 space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <span>Progresso do Bolão: <strong class="text-white">{{ campeonatoAtivo.nome }}</strong></span>
                  <span v-if="rodada && campeonatoAtivo.max_rodadas">Rodada {{ rodada.numero_rodada }} de {{ campeonatoAtivo.max_rodadas }}</span>
                </div>
                <div v-if="rodada && campeonatoAtivo.max_rodadas" class="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                  <div 
                    class="bg-gradient-to-r from-brand-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_var(--brand-glow)]"
                    :style="{ width: `${(rodada.numero_rodada / campeonatoAtivo.max_rodadas) * 100}%` }"
                  />
                </div>
                <div v-else class="text-xs text-gray-500 font-bold uppercase tracking-wide">Cronograma em processamento</div>
              </div>

              <!-- Contador de Urgência (Countdown) -->
              <div class="w-full md:w-auto shrink-0 flex items-center gap-3 bg-brand-500/10 border border-brand-500/20 rounded-full px-5 py-2.5 shadow-inner">
                <div class="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
                <span class="text-[11px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400">
                  {{ locked ? 'Mercado Fechado' : `Fecha em: ${timeRemaining || 'Calculando...'}` }}
                </span>
              </div>
            </div>

          </div>

          <!-- Boas-vindas sem bolão ativo -->
          <div v-else class="py-10 text-center space-y-3 animate-fade-in-up">
            <span class="text-5xl block animate-bounce">🏟️</span>
            <h3 class="text-2xl font-bebas text-gray-900 dark:text-white tracking-widest">BEM-VINDO AO +BET!</h3>
            <p class="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Você ainda não está ativo em nenhum bolão. Solicite acesso a um dos campeonatos disponíveis no Lobby abaixo para começar a palpitar!
            </p>
          </div>

        </div>
        <div v-else class="animate-pulse space-y-6 py-4">
           <div class="h-10 bg-white/5 rounded-xl w-1/2"></div>
           <div class="h-32 bg-white/5 rounded-[2rem]"></div>
        </div>
      </BaseCard>

      <!-- Dashboard Central Grid: Palpites Rápidos + Ranking Geral -->
      <div v-if="campeonatoAtivo" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Coluna Esquerda: Palpites Rápidos (8/12) -->
        <div class="lg:col-span-8 space-y-6">
          <div class="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <!-- Header do Widget -->
            <div class="bg-white/5 py-4 sm:py-5 px-4 sm:px-8 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 class="text-xl font-bebas text-white tracking-widest">⚡ PALPITES RÁPIDOS</h3>
                <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Próximos confrontos da rodada</p>
              </div>
              <span v-if="rodada" class="text-[9px] font-black uppercase tracking-widest bg-brand-500/10 text-brand-400 border border-brand-500/20 px-3 py-1 rounded-full whitespace-nowrap shrink-0">
                Rodada {{ rodada.numero_rodada }}
              </span>
            </div>

            <!-- Loading Bets -->
            <div v-if="loadingBets" class="p-20 text-center flex flex-col items-center justify-center space-y-4">
              <div class="w-10 h-10 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
              <span class="text-brand-400 font-bebas text-lg tracking-widest">Sincronizando Partidas...</span>
            </div>

            <!-- Aguardando Escolha State (LIGA ONLY) -->
            <div v-else-if="isAguardandoEscolha" class="p-16 text-center space-y-4">
              <span class="text-5xl block animate-pulse">⏳</span>
              <h4 class="text-lg font-bebas text-white tracking-wider uppercase">Aguardando Escolha do Organizador</h4>
              <p class="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                <template v-if="profile?.id === rodada?.organizer_id">
                  Você foi sorteado para escolher as partidas extras desta rodada! Acesse a página de palpites para definir os jogos.
                </template>
                <template v-else>
                  A Rodada {{ rodada?.numero_rodada }} está aguardando o organizador 
                  <strong class="text-white">{{ rodada?.organizador?.nome || 'definido' }}</strong> escolher as partidas extras.
                </template>
              </p>
              <div class="pt-2">
                <NuxtLink to="/palpites" class="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-black dark:text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-2xl transition-all shadow-[0_0_15px_var(--brand-glow)]">
                  {{ profile?.id === rodada?.organizer_id ? 'Escolher Jogos Extras' : 'Acessar Palpites' }} →
                </NuxtLink>
              </div>
            </div>

            <!-- Palpites Encerrados (Nenhuma rodada aberta ou aguardando) -->
            <div v-else-if="isPalpitesFechados" class="p-16 text-center space-y-3">
              <span class="text-4xl block">🔒</span>
              <h4 class="text-lg font-bebas text-gray-400 tracking-wider">PALPITES ENCERRADOS</h4>
              <p class="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                Não há rodadas abertas para novos palpites neste bolão no momento. Acompanhe os resultados no ranking!
              </p>
            </div>

            <!-- Grid de Confrontos -->
            <div v-else-if="quickMatches.length > 0" class="divide-y divide-white/5 max-h-[550px] overflow-y-auto pr-1">
              <BetMatchCard 
                v-for="jogo in quickMatches" 
                :key="jogo.id"
                :match="jogo"
                :model-value="bets[jogo.id] || { id: null, gols_casa_bet: 0, gols_fora_bet: 0 }"
                @update:model-value="val => bets[jogo.id] = val"
                :shield-home="jogo.api_team_home_id != null ? escudosMap[jogo.api_team_home_id] : undefined"
                :shield-away="jogo.api_team_away_id != null ? escudosMap[jogo.api_team_away_id] : undefined"
                :is-locked="locked"
              />
            </div>

            <!-- Sem confrontos pendentes -->
            <div v-else class="p-16 text-center space-y-3">
              <span class="text-4xl block">🎉</span>
              <h4 class="text-lg font-bebas text-gray-400 tracking-wider">TUDO PRONTO POR AQUI!</h4>
              <p class="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                Você já palpitou em todos os confrontos disponíveis ou a rodada não possui jogos pendentes no momento.
              </p>
            </div>

            <!-- Barra de Ações (Apenas se a rodada estiver aberta e houver palpites para salvar) -->
            <div v-if="quickMatches.length > 0 && !locked && !isAguardandoEscolha && !isPalpitesFechados" class="p-6 bg-white/5 border-t border-white/5 flex justify-end">
              <button 
                @click="handleSaveQuickBets" 
                :disabled="salvandoBets" 
                class="bg-brand-500 hover:bg-brand-600 text-black dark:text-white font-black text-xs uppercase tracking-widest py-3.5 px-8 rounded-2xl transition-all shadow-[0_0_15px_var(--brand-glow)] hover:scale-[1.03] disabled:opacity-50 flex items-center gap-2"
              >
                <span v-if="salvandoBets" class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                {{ salvandoBets ? 'Salvando...' : 'Salvar Palpites Rápidos' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Coluna Direita: Mini Ranking (4/12) -->
        <div class="lg:col-span-4 space-y-6">
          <div class="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl p-6 space-y-6">
            <div>
              <h3 class="text-sm font-black uppercase tracking-[0.2em] text-white">🏆 RANKING DO BOLÃO</h3>
              <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Classificação atualizada</p>
            </div>
            
            <div v-if="loadingRanking" class="flex flex-col items-center justify-center py-10 space-y-2">
              <div class="w-8 h-8 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
              <span class="text-brand-400 font-bebas text-sm">Atualizando...</span>
            </div>
            
            <div v-else-if="ranking.length === 0" class="py-10 text-center">
              <span class="text-3xl opacity-30 block mb-2">🏆</span>
              <p class="text-xs text-gray-500 uppercase font-black tracking-widest">Sem pontuações ainda</p>
            </div>

            <div v-else class="space-y-3">
              <!-- Top 3 -->
              <div 
                v-for="entry in ranking.slice(0, 3)" 
                :key="entry.usuario_id"
                class="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all"
                :class="{ 'bg-brand-500/[0.05] border-brand-500/20': entry.usuario_id === user?.id }"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-xl flex items-center justify-center font-bebas text-lg shrink-0"
                       :class="
                         entry.position === 1 ? 'bg-gold-500/20 text-yellow-400 border border-yellow-500/30' :
                         entry.position === 2 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                         'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                       "
                  >
                    {{ entry.position }}º
                  </div>
                  <img v-if="entry.escudo_url" :src="entry.escudo_url" class="w-8 h-8 object-contain shrink-0" />
                  <span v-else class="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-xs flex items-center justify-center font-bebas text-gray-400 shrink-0">{{ entry.nome.charAt(0) }}</span>
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-white truncate max-w-[120px]">{{ entry.nome }}</p>
                    <p class="text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate">{{ entry.time_nome || 'Sem Time' }}</p>
                  </div>
                </div>
                <div class="text-right shrink-0 ml-2">
                  <span class="font-bebas text-xl text-white">{{ entry.total_pontos }} <span class="text-[10px] uppercase font-black text-gray-500">pts</span></span>
                </div>
              </div>
              
              <!-- Posição do Usuário se fora do Top 3 -->
              <template v-if="userRankingEntry && userRankingEntry.position > 3">
                <div class="flex justify-center my-2">
                  <div class="h-4 border-l border-dashed border-white/10" />
                </div>
                
                <div 
                  class="flex items-center justify-between p-3.5 rounded-2xl bg-brand-500/[0.08] border border-brand-500/30 shadow-[0_0_15px_rgba(0,232,122,0.05)] animate-fade-in"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bebas text-lg shrink-0">
                      {{ userRankingEntry.position }}º
                    </div>
                    <img v-if="userRankingEntry.escudo_url" :src="userRankingEntry.escudo_url" class="w-8 h-8 object-contain shrink-0" />
                    <span v-else class="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-xs flex items-center justify-center font-bebas text-gray-400 shrink-0">{{ userRankingEntry.nome.charAt(0) }}</span>
                    <div class="min-w-0">
                      <p class="text-xs font-bold text-white truncate max-w-[120px]">Você ({{ userRankingEntry.nome.split(' ')[0] }})</p>
                      <p class="text-[9px] text-brand-400 font-bold uppercase tracking-widest truncate">{{ userRankingEntry.time_nome || 'Sem Time' }}</p>
                    </div>
                  </div>
                  <div class="text-right shrink-0 ml-2">
                    <span class="font-bebas text-xl text-brand-400">{{ userRankingEntry.total_pontos }} <span class="text-[10px] uppercase font-black text-brand-500">pts</span></span>
                  </div>
                </div>
              </template>
              
              <!-- Link Geral -->
              <NuxtLink to="/ranking" class="block w-full text-center py-3.5 bg-brand-500/10 hover:bg-brand-500/20 active:scale-[0.98] rounded-2xl border border-brand-500/20 hover:border-brand-500/40 text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 hover:text-brand-300 transition-all shadow-[0_0_20px_rgba(34,197,94,0.05)]">
                Ver Classificação Completa →
              </NuxtLink>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- HUB DE BOLÕES (Lobby) -->
    <!-- CRITICAL FIX: profileLoaded garante que o lobby só renderiza após o perfil estar pronto,
         evitando o flash de "SEM ACESSO" em todos os bolões durante a hidratação do cliente. -->
    <div v-if="profileLoaded && (!campeonatoAtivo || !isAdmin)" class="space-y-6">
       <div class="flex items-center gap-4 border-b border-gray-200 dark:border-white/10 pb-4">
          <div class="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center text-2xl shadow-lg">🏆</div>
          <div>
            <h2 class="text-3xl font-bebas text-gray-900 dark:text-white tracking-widest">Lobby de Campeonatos</h2>
            <p class="text-sm font-bold uppercase tracking-widest text-gray-500">Selecione o bolão desejado para entrar em campo</p>
          </div>
       </div>

       <div v-if="campeonatos.length === 0" class="py-20 text-center">
          <span class="text-6xl mb-4 block opacity-50">⚽</span>
          <h3 class="text-2xl font-bebas text-gray-500 tracking-widest">Nenhum Campeonato Ativo</h3>
          <p class="text-gray-600 mt-2 text-sm max-w-sm mx-auto">Peça para o administrador ativar novos bolões para você começar a palpitar.</p>
       </div>

       <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
             v-for="camp in campeonatos.filter(c => c.status === 'ativo')" 
             :key="camp.id"
             class="group relative flex flex-col text-left overflow-hidden bg-white dark:bg-[#151515] rounded-[2rem] border shadow-xl transition-all duration-500 outline-none"
             :class="hasAccess(camp)
               ? 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a] border-gray-200 dark:border-white/5 hover:border-brand-500/50 cursor-pointer hover:shadow-glow-brand'
               : 'border-gray-200 dark:border-white/5 opacity-90'"
             @click="hasAccess(camp) ? enterBolao(camp.id) : null"
          >
             <!-- Decoration Flow -->
             <div class="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-2xl transition-colors duration-500 pointer-events-none"
                  :class="hasAccess(camp) ? 'bg-brand-500/10 group-hover:bg-brand-500/20' : 'bg-gray-500/5'"></div>

             <div class="p-8 flex-1 w-full space-y-6 z-10">
                <!-- Escudo do Campeonato -->
                <div class="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center justify-center p-2 shadow-inner transition-transform duration-500 relative overflow-hidden"
                     :class="hasAccess(camp) ? 'group-hover:scale-110' : ''">
                    <div class="absolute inset-0 transition-colors"
                         :class="hasAccess(camp) ? 'bg-brand-500/5 group-hover:bg-brand-500/10' : 'bg-gray-500/5'"></div>
                    
                    <img 
                      v-if="camp.logo_url" 
                      :src="camp.logo_url" 
                      :alt="camp.nome" 
                      class="w-full h-full object-contain drop-shadow-lg relative z-10"
                      :class="{ 'grayscale opacity-60': !hasAccess(camp) }"
                      @error="(e) => (e.target as HTMLImageElement).src = 'https://crests.football-data.org/764.png'" 
                    >
                    <div v-else class="flex flex-col items-center justify-center relative z-10">
                       <span class="text-3xl filter grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all">🏆</span>
                       <span class="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter mt-1">{{ camp.api_competition_code }}</span>
                    </div>
                </div>

                <!-- Info -->
                <div>
                   <div class="flex items-center gap-2 mb-2 flex-wrap">
                       <!-- Ativo/Acesso Badges -->
                       <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest" 
                             :class="hasAccess(camp) ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20' : 'bg-brand-500/10 text-brand-600 dark:text-brand-400'">
                         Ativo
                       </span>
                       
                       <span v-if="hasAccess(camp)" class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                         ⚽ Inscrito
                       </span>

                       <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest shadow-sm">{{ camp.season || new Date().getFullYear() }}</span>
                       
                       <!-- Lock badge for no-access -->
                       <span v-if="!isAdmin && !hasAccess(camp)" class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                         🔒 Sem acesso
                       </span>
                       
                       <!-- Creation Date Badge -->
                       <span v-if="camp.created_at" class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-gray-500/10 text-gray-400 border border-gray-500/20 ml-auto" :title="`Criado em: ${new Date(camp.created_at).toLocaleString('pt-BR')}`">
                         🕒 {{ new Date(camp.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) }}
                       </span>
                   </div>
                   <h3 class="text-2xl font-bebas tracking-widest transition-colors"
                       :class="hasAccess(camp) ? 'text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400' : 'text-gray-900 dark:text-white'">
                     {{ camp.nome }}
                   </h3>
                   <p v-if="camp.apelido_grupo" class="text-xs text-amber-400 font-bold mt-0.5">📎 {{ camp.apelido_grupo }}</p>
                   <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider text-[10px]">{{ camp.max_rodadas }} Rodadas Oficiais</p>
                </div>
             </div>

             <!-- Action Bar -->
             <!-- Has Access: Enter -->
             <div v-if="isAdmin || hasAccess(camp)" 
                  class="w-full bg-brand-500/10 dark:bg-brand-500/10 border-t border-brand-500/20 py-4 px-8 flex justify-between items-center z-10 group-hover:bg-brand-600 dark:group-hover:bg-brand-500 transition-colors duration-300 cursor-pointer">
                 <span class="text-xs font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 group-hover:text-white transition-colors">Acessar Bolão</span>
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-brand-500 dark:text-brand-400 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                 </svg>
             </div>
             
             <!-- Pending Request -->
             <div v-else-if="isPendingRequest(camp.id)"
                  class="w-full bg-amber-500/5 border-t border-amber-500/10 py-4 px-8 flex justify-between items-center z-10">
                 <span class="text-xs font-black uppercase tracking-[0.2em] text-amber-500">⏳ Solicitação Pendente</span>
             </div>

             <!-- Sistema Pendente: não pode solicitar bolão ainda -->
             <div v-else-if="(profile as any)?.status === 'pendente'"
                  class="w-full bg-gray-500/5 border-t border-gray-500/10 py-4 px-8 flex justify-between items-center z-10">
                <span class="text-xs font-black uppercase tracking-[0.2em] text-gray-500">⏳ Aguardando aprovação da conta</span>
             </div>

             <!-- No Access: Request -->
             <button v-else
                  @click.stop="handleRequestBolao(camp)"
                  :disabled="requestingBolao === camp.id"
                  class="w-full bg-amber-500/10 dark:bg-amber-500/10 border-t border-amber-500/20 py-4 px-8 flex justify-between items-center z-10 hover:bg-amber-600 dark:hover:bg-amber-500 group transition-colors duration-300 cursor-pointer disabled:opacity-50">
                 <span class="text-xs font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 group-hover:text-white transition-colors">
                   {{ requestingBolao === camp.id ? 'Enviando...' : 'Solicitar Acesso' }}
                 </span>
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500 dark:text-amber-400 group-hover:text-white group-hover:scale-110 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                 </svg>
             </button>
          </div>
       </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

// Base UI
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSelect from '~/components/ui/BaseSelect.vue'
import BetMatchCard from '~/components/bet/BetMatchCard.vue'

// Composables
import { useRanking } from '~/composables/useRanking'
import { useBets } from '~/composables/useBets'

const { profile, user, profileLoaded } = useAuth()
const supabase = useSupabaseClient<any>()
const router = useRouter()
const toast = useToast()

const isAdmin = computed(() => profile.value?.is_admin === true)
const { campeonatos, campeonatoAtivo, selecionarCampeonato, isCopaAtivo } = useCampeonato()
const { solicitarAcessoBolao } = useSolicitacoes()

// Composables de dados do Dashboard
const { ranking, loading: loadingRanking, fetchRanking } = useRanking()
const { 
  rodada, 
  loading: loadingBets, 
  bets, 
  escudosMap, 
  timeRemaining, 
  fetchInitialData, 
  saveAllBets, 
  sortedMatches,
  salvando: salvandoBets,
  locked
} = useBets()

// Track pending bolão requests for the current user
const pendingBolaoRequests = ref<Set<string>>(new Set())
const requestingBolao = ref<string | null>(null)
const selectedCampId = ref('')

// Check if user has access to a campeonato
const hasAccess = (camp: any) => {
  if (isAdmin.value) return true
  return !!camp.user_acesso
}

// Check if there's a pending request for this bolão
const isPendingRequest = (campId: string) => {
  return pendingBolaoRequests.value.has(campId)
}

// Filtra apenas campeonatos em que o jogador possui acesso ativo
const activeUserCamps = computed(() => campeonatos.value.filter(c => hasAccess(c)))

// Auto-selecionar campeonato ativo padrão no lobby se nenhum estiver selecionado
const initActiveCampeonato = () => {
  const firstCamp = activeUserCamps.value[0]
  if (!campeonatoAtivo.value && firstCamp) {
    selecionarCampeonato(firstCamp.id)
  }
}

// Estatísticas do Usuário baseadas no Ranking
const userRankingEntry = computed(() => {
  const currentUser = user.value
  if (!currentUser || !ranking.value) return null
  return ranking.value.find(r => r.usuario_id === currentUser.id)
})

const userAproveitamento = computed(() => {
  const entry = userRankingEntry.value
  if (!entry || !entry.total_palpites) return 0
  return Math.round(((entry.total_cravados + entry.total_acertos) / entry.total_palpites) * 100)
})

// Status auxiliares de rodada
const isAguardandoEscolha = computed(() => {
  return rodada.value?.status === 'aguardando_escolha' && !isCopaAtivo.value
})

const isPalpitesFechados = computed(() => {
  return !rodada.value || (rodada.value.status !== 'aberta' && rodada.value.status !== 'aguardando_escolha')
})

// Todos os confrontos pendentes/não iniciados da rodada
const quickMatches = computed(() => {
  if (!sortedMatches.value) return []
  return sortedMatches.value
    .filter(m => new Date(m.data_partida).getTime() > new Date().getTime())
})

// Salvar palpites rápidos diretamente da tela inicial
const handleSaveQuickBets = async () => {
  const result = await saveAllBets()
  if (result && result.success) {
    toast.success('🎯 Palpites rápidos salvos com sucesso! Boa sorte!')
    await fetchRanking()
  } else if (result) {
    let msg = result.message || ''
    if (msg.includes('row-level security') || msg.includes('policy')) {
      msg = 'Aguarde a escolha do organizador! A rodada ainda não está aberta para palpitar.'
    }
    toast.error('Erro ao salvar: ' + msg)
  }
}

const clearingIndexAlert = ref(false)

const clearIndexRoundAlert = async () => {
  if (!rodada.value) return
  clearingIndexAlert.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Não autenticado.')

    await $fetch(`/api/admin/rounds/${rodada.value.id}/clear-alert`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    toast.success('Alerta de alteração limpo com sucesso!')
    await fetchInitialData()
  } catch (e: any) {
    console.error(e)
    toast.error('Erro ao limpar alerta.')
  } finally {
    clearingIndexAlert.value = false
  }
}

// Fetch pending bolão requests for the current user
const fetchPendingRequests = async () => {
  const email = profile.value?.email
  if (!email || isAdmin.value) return

  const { data } = await supabase
    .from('solicitacoes')
    .select('campeonato_id')
    .eq('email', email)
    .eq('tipo', 'acesso_bolao')
    .eq('status', 'pendente')

  if (data) {
    pendingBolaoRequests.value = new Set(
      data.map((r: any) => r.campeonato_id).filter(Boolean)
    )
  }
}

// Handle bolão access request
const handleRequestBolao = async (camp: any) => {
  if (!profile.value) return
  // Segurança: admin nunca deve criar solicitações de acesso a bolão.
  // Isso evita gravações indevidas caso o estado seja transitório/incorreto.
  if (isAdmin.value) return
  
  requestingBolao.value = camp.id
  try {
    const userId = (profile.value as any).id
    await solicitarAcessoBolao(
      profile.value.email,
      userId,
      camp.id,
      profile.value.nome
    )
    pendingBolaoRequests.value.add(camp.id)
    toast.success(`Solicitação enviada para ${camp.nome}!`)
  } catch (err: any) {
    toast.error(err.message || 'Erro ao solicitar acesso.')
  } finally {
    requestingBolao.value = null
  }
}

// --- Módulo de Monitoramento do Administrador ---
const adminMonitorLoading = ref(false)
const adminMonitorError = ref<string | null>(null)
const adminMonitorUsers = ref<Array<{
  id: string
  nome: string
  email: string
  telefone: string | null
  time_nome: string | null
  palpites_count: number
}>>([])

const searchQuery = ref('')
const statusFilter = ref<'all' | 'pending' | 'completed'>('all')

const fetchAdminMonitorData = async () => {
  if (!campeonatoAtivo.value || !rodada.value) {
    adminMonitorUsers.value = []
    return
  }

  adminMonitorLoading.value = true
  adminMonitorError.value = null

  try {
    // 1. Buscar os emails dos participantes que possuem acesso a este campeonato
    const { data: acessos, error: acessosErr } = await supabase
      .from('campeonato_acessos')
      .select('email, time_id, times(nome)')
      .eq('campeonato_id', campeonatoAtivo.value.id)

    if (acessosErr) throw acessosErr
    if (!acessos || acessos.length === 0) {
      adminMonitorUsers.value = []
      return
    }

    const emailsList = acessos.map(a => a.email.toLowerCase())

    // 2. Buscar usuários correspondentes (apenas não-admins)
    const { data: users, error: usersErr } = await supabase
      .from('usuarios')
      .select('id, nome, email, telefone')
      .eq('is_admin', false)

    if (usersErr) throw usersErr

    // Filtrar apenas usuários válidos para este campeonato
    const authorizedUsers = (users || []).filter(u => emailsList.includes(u.email.toLowerCase()))

    if (authorizedUsers.length === 0) {
      adminMonitorUsers.value = []
      return
    }

    // 3. Buscar palpites feitos para as partidas da rodada ativa
    const matchIds = sortedMatches.value.map(m => m.id)
    let palpites: any[] = []

    if (matchIds.length > 0) {
      const { data: palpitesData, error: palpitesErr } = await supabase
        .from('palpites')
        .select('usuario_id, partida_id')
        .in('partida_id', matchIds)

      if (palpitesErr) throw palpitesErr
      palpites = palpitesData || []
    }

    // 4. Mapear dados finais para monitoramento
    adminMonitorUsers.value = authorizedUsers.map(user => {
      const userAcesso = acessos.find(a => a.email.toLowerCase() === user.email.toLowerCase())
      const userPalpites = palpites.filter(p => p.usuario_id === user.id)

      return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        time_nome: (userAcesso?.times as any)?.nome || 'Sem Time',
        palpites_count: userPalpites.length
      }
    })
  } catch (err: any) {
    console.error('Erro ao buscar dados de monitoramento:', err)
    adminMonitorError.value = err.message || 'Erro ao carregar dados de monitoramento.'
  } finally {
    adminMonitorLoading.value = false
  }
}

// Filtragem computada dos usuários monitorados
const filteredMonitorUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const filter = statusFilter.value
  const totalMatches = sortedMatches.value.length

  return adminMonitorUsers.value.filter(user => {
    // Filtro de Busca
    const matchesSearch = !query || 
      user.nome.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query)

    if (!matchesSearch) return false

    // Filtro de Status
    if (filter === 'completed') {
      return user.palpites_count === totalMatches
    } else if (filter === 'pending') {
      return user.palpites_count < totalMatches
    }

    return true
  })
})

// Função para copiar texto do lembrete
const copyReminderText = (user: any) => {
  const total = sortedMatches.value.length
  const faltam = total - user.palpites_count
  const campNome = campeonatoAtivo.value?.nome || ''
  const campApelido = campeonatoAtivo.value?.apelido_grupo ? ` 📎 ${campeonatoAtivo.value.apelido_grupo}` : ''
  const msg = `Fala ${user.nome.split(' ')[0]}! Passando para lembrar de dar seus palpites na Rodada ${rodada.value?.numero_rodada} do bolão ${campNome}${campApelido}. Faltam ${faltam} jogo(s) para você palpitar! Acesse: https://mais-bet.vercel.app/`
  
  if (navigator.clipboard) {
     navigator.clipboard.writeText(msg)
     toast.success(`Lembrete para ${user.nome.split(' ')[0]} copiado!`)
  } else {
     toast.error('Não foi possível copiar para a área de transferência.')
  }
}

// Função para gerar link do WhatsApp
const getWhatsAppLink = (user: any) => {
  if (!user.telefone) return '#'
  
  const total = sortedMatches.value.length
  const faltam = total - user.palpites_count
  
  // Limpar formatação do telefone mantendo apenas números
  let cleanPhone = user.telefone.replace(/\D/g, '')
  
  // Se não começar com DDI (55) e tiver celular nacional, adiciona 55
  if (cleanPhone.length >= 10 && cleanPhone.length <= 11 && !cleanPhone.startsWith('55')) {
    cleanPhone = '55' + cleanPhone
  }
  
  const campNome = campeonatoAtivo.value?.nome || ''
  const campApelido = campeonatoAtivo.value?.apelido_grupo ? ` 📎 ${campeonatoAtivo.value.apelido_grupo}` : ''
  const text = encodeURIComponent(
    `Fala ${user.nome.split(' ')[0]}! Passando para lembrar de dar seus palpites na Rodada ${rodada.value?.numero_rodada} do bolão ${campNome}${campApelido}. Faltam ${faltam} jogo(s) para você palpitar! Jogue agora: https://mais-bet.vercel.app/`
  )
  
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`
}

const enterBolao = (id: string) => {
    selecionarCampeonato(id)
    if (!isAdmin.value) {
      router.push('/palpites')
    }
}

// Sincronizar dados do cliente ao montar ou ao alterar campeonato ativo
onMounted(async () => {
  initActiveCampeonato()
  if (campeonatoAtivo.value) {
    selectedCampId.value = campeonatoAtivo.value.id
    await Promise.all([
      fetchRanking(),
      fetchInitialData()
    ])
    if (isAdmin.value) {
      await fetchAdminMonitorData()
    }
  }
})

watch(campeonatoAtivo, async (newCamp) => {
  if (process.client) {
    if (newCamp) {
      selectedCampId.value = newCamp.id
      await Promise.all([
        fetchRanking(),
        fetchInitialData()
      ])
      if (isAdmin.value) {
        await fetchAdminMonitorData()
      }
    } else {
      selectedCampId.value = ''
    }
  }
}, { immediate: true })

// Fetch on server-side to avoid layout shift, but lazy to keep navigation instant
useLazyAsyncData('pending-requests', async () => {
  await fetchPendingRequests()
  return true
})

// SEO
useHead({
  title: '+BET | Seu Hub de Bolões',
  meta: [
    { name: 'description', content: 'Lobby principal. Escolha seu bolão e deixe seus palpites.' }
  ]
})
</script>

<style scoped>
.animate-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
</style>

