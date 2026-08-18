<template>
  <div class="space-y-12 animate-fade-in">
    
    <!-- Banner discreto para o Admin quando estiver visualizando a página do jogo -->
    <div v-if="isAdmin" class="bg-brand-500/10 border border-brand-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
      <div class="flex items-center gap-3">
        <span class="text-2xl">👑</span>
        <div>
          <span class="text-xs font-black uppercase tracking-wider text-brand-400 block">Modo de Visualização do Jogador</span>
          <span class="text-xs text-gray-400">Você está navegando na interface pública do jogo.</span>
        </div>
      </div>
      <NuxtLink to="/admin" class="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-all shadow-md hover:scale-105 active:scale-95 shrink-0 text-center">
        Acessar Painel Admin com Sidebar →
      </NuxtLink>
    </div>

    <!-- PAINEL DO JOGADOR (Dashboard do Jogo) -->
    <div class="space-y-8">
      
      <!-- Central do Competidor (Hero Card) -->
      <BaseCard variant="pitch" class="p-6 md:p-8">
        <div v-if="profile" class="space-y-8">
          
          <!-- Banner Topo com Boas-Vindas e Seletor -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <h1 class="text-4xl sm:text-5xl md:text-6xl font-bebas tracking-wide text-gray-900 dark:text-white mb-2">
                E AÍ, <span class="text-brand-600 dark:text-brand-400">{{ profile.nome.split(' ')[0] }}</span>!
              </h1>
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full animate-pulse bg-emerald-500"></div>
                <p class="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-emerald-400">
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
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
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
            <div class="flex flex-col gap-6 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
              <!-- Barra de Progresso -->
              <div class="w-full space-y-2">
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
              <div 
                class="w-full flex items-center justify-center gap-2 sm:gap-3 rounded-2xl py-3 sm:py-4.5 px-3 sm:px-8 shadow-inner transition-all max-w-full overflow-hidden"
                :class="(!rodada || locked) 
                  ? 'bg-red-500/10 border border-red-500/25 hover:bg-red-500/15' 
                  : 'bg-brand-500/10 border border-brand-500/25 hover:bg-brand-500/15'"
              >
                <div 
                  class="w-2 h-2 sm:w-3 sm:h-3 rounded-full animate-pulse shrink-0"
                  :class="(!rodada || locked) ? 'bg-red-500' : 'bg-brand-500'"
                ></div>
                <span 
                  class="text-[11px] sm:text-lg md:text-xl lg:text-2xl font-black uppercase tracking-wider whitespace-nowrap font-mono"
                  :class="(!rodada || locked) ? 'text-red-600 dark:text-red-400' : 'text-brand-600 dark:text-brand-400'"
                >
                  {{ loadingBets ? 'Calculando...' : (!rodada || locked) ? 'Mercado Fechado' : `Fecha em: ${timeRemaining || 'Calculando...'}` }}
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
      <div v-if="campeonatoAtivo" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        <!-- Coluna Esquerda: Palpites Rápidos (8/12) -->
        <div class="lg:col-span-8 flex flex-col">
          <div class="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col flex-1">
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
            <div v-if="loadingBets" class="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
              <div class="w-16 h-16 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
              <span class="text-brand-400 font-bebas text-3xl tracking-widest">Sincronizando Partidas...</span>
            </div>

            <!-- Aguardando Escolha State (LIGA ONLY) -->
            <div v-else-if="isAguardandoEscolha" class="flex-1 flex flex-col items-center justify-center p-16 text-center space-y-6">
              <span class="text-8xl block animate-pulse">⏳</span>
              <div class="space-y-3">
                <h4 class="text-3xl font-bebas text-white tracking-wider uppercase">Aguardando Escolha do Organizador</h4>
                <p class="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                  <template v-if="profile?.id === rodada?.organizer_id">
                    Você foi sorteado para escolher as partidas extras desta rodada! Acesse a página de palpites para definir os jogos.
                  </template>
                  <template v-else>
                    A Rodada {{ rodada?.numero_rodada }} está aguardando o organizador 
                    <strong class="text-white">{{ rodada?.organizador?.nome || 'definido' }}</strong> escolher as partidas extras.
                  </template>
                </p>
              </div>
              <div class="pt-2">
                <NuxtLink to="/palpites" class="inline-flex items-center gap-3 bg-brand-500 hover:bg-brand-600 text-black dark:text-white font-black text-sm uppercase tracking-widest py-4 px-10 rounded-2xl transition-all shadow-[0_0_20px_var(--brand-glow)] hover:scale-105">
                  {{ profile?.id === rodada?.organizer_id ? 'Escolher Jogos Extras' : 'Acessar Palpites' }} →
                </NuxtLink>
              </div>
            </div>

            <!-- Palpites Encerrados (Nenhuma rodada aberta ou aguardando) -->
            <div v-else-if="isPalpitesFechados" class="flex-1 flex flex-col">
              <!-- Locked Message -->
              <div class="py-10 px-10 text-center space-y-4">
                <span class="text-7xl block">🔒</span>
                <h4 class="text-2xl font-bebas text-gray-400 tracking-wider">PALPITES ENCERRADOS</h4>
                <p class="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Não há rodadas abertas para novos palpites neste bolão no momento. Acompanhe os resultados no ranking!
                </p>
              </div>

              <!-- Últimos Palpites (Read-Only) -->
              <div v-if="lastClosedRound && Object.keys(lastRoundBets).length > 0" class="border-t border-white/5">
                <div class="px-6 py-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  <span class="text-[9px] font-black uppercase tracking-widest text-gray-500">Seus palpites — Rodada {{ lastClosedRound.numero_rodada }}</span>
                </div>
                <!-- scroll-container: pointer-events ativados para rolar, cards desabilitados individualmente -->
                <div class="opacity-55 divide-y divide-white/5 max-h-[420px] overflow-y-auto" style="-webkit-overflow-scrolling: touch;">
                  <div
                    v-for="jogo in [...lastClosedRound.partidas].sort((a: any, b: any) => new Date(a.data_partida).getTime() - new Date(b.data_partida).getTime())"
                    :key="jogo.id"
                    class="pointer-events-none"
                  >
                    <BetMatchCard
                      :match="jogo"
                      :model-value="lastRoundBets[jogo.id] || { id: null, gols_casa_bet: 0, gols_fora_bet: 0 }"
                      @update:model-value="() => {}"
                      :shield-home="(jogo as any).api_team_home_id != null ? escudosMap[(jogo as any).api_team_home_id] : undefined"
                      :shield-away="(jogo as any).api_team_away_id != null ? escudosMap[(jogo as any).api_team_away_id] : undefined"
                      :is-locked="true"
                    />
                  </div>
                </div>
                <div class="py-3 text-center">
                  <span class="text-[9px] text-gray-500 font-bold uppercase tracking-widest">👁 Somente visualização</span>
                </div>
              </div>
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
            <div v-else class="flex-1 flex flex-col items-center justify-center p-16 text-center space-y-6">
              <span class="text-8xl block">🎉</span>
              <div class="space-y-3">
                <h4 class="text-3xl font-bebas text-gray-400 tracking-wider">TUDO PRONTO POR AQUI!</h4>
                <p class="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Você já palpitou em todos os confrontos disponíveis ou a rodada não possui jogos pendentes no momento.
                </p>
              </div>
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

          <!-- Card de Organizadores das Rodadas (Competidor) -->
          <NuxtLink to="/organizadores" class="block bg-white/5 border border-white/10 rounded-[2.5rem] p-6 hover:bg-white/10 hover:border-brand-500/50 transition-all group">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 text-xl border border-brand-500/20 shadow-inner group-hover:scale-110 transition-transform">
                📋
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-white">Organizadores</h3>
                <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Histórico dos organizadores das rodadas</p>
              </div>
            </div>
          </NuxtLink>
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
  locked,
  lastClosedRound,
  lastRoundBets
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
// Usa profile.value?.id (UUID da tabela usuarios) porque o objeto auth do Supabase
// expõe o ID em .sub (não em .id) — profile.id é sempre o UUID correto
const userRankingEntry = computed(() => {
  const userId = profile.value?.id
  if (!userId || !ranking.value?.length) return null
  return ranking.value.find(r => r.usuario_id === userId) ?? null
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

