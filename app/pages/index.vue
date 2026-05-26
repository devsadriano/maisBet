<template>
  <div class="space-y-12 pb-20 animate-fade-in">
    
    <!-- 1. PAINEL DO ADMINISTRADOR (Simplificado e focado) -->
    <div v-if="isAdmin" class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
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
            <div v-if="activeUserCamps.length > 1" class="flex items-center gap-3">
              <span class="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40">Visualizar Bolão:</span>
              <select 
                v-model="selectedCampId" 
                @change="selecionarCampeonato(selectedCampId)"
                class="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-brand-500 cursor-pointer"
              >
                <option 
                  v-for="camp in activeUserCamps" 
                  :key="camp.id" 
                  :value="camp.id"
                  class="bg-[#1e1e1e] text-white"
                >
                  {{ camp.nome }}
                </option>
              </select>
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
            <div class="bg-white/5 py-5 px-8 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 class="text-xl font-bebas text-white tracking-widest">⚡ PALPITES RÁPIDOS</h3>
                <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Próximos confrontos da rodada</p>
              </div>
              <span v-if="rodada" class="text-[9px] font-black uppercase tracking-widest bg-brand-500/10 text-brand-400 border border-brand-500/20 px-3 py-1 rounded-full">
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
            <div v-else-if="quickMatches.length > 0" class="divide-y divide-white/5">
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
              <NuxtLink to="/ranking" class="block w-full text-center py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-all">
                Ver Classificação Completa →
              </NuxtLink>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- HUB DE BOLÕES (Lobby) -->
    <div class="space-y-6">
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
                  class="w-full bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 py-4 px-8 flex justify-between items-center z-10 group-hover:bg-brand-500 group-hover:border-brand-500 transition-colors duration-300 cursor-pointer">
                 <span class="text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 group-hover:text-white transition-colors">Acessar Bolão</span>
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                 </svg>
             </div>
             
             <!-- Pending Request -->
             <div v-else-if="isPendingRequest(camp.id)"
                  class="w-full bg-amber-500/5 border-t border-amber-500/10 py-4 px-8 flex justify-between items-center z-10">
                 <span class="text-xs font-black uppercase tracking-[0.2em] text-amber-500">⏳ Solicitação Pendente</span>
             </div>

             <!-- No Access: Request -->
             <button v-else
                  @click.stop="handleRequestBolao(camp)"
                  :disabled="requestingBolao === camp.id"
                  class="w-full bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 py-4 px-8 flex justify-between items-center z-10 hover:bg-amber-500 hover:border-amber-500 transition-colors duration-300 cursor-pointer disabled:opacity-50">
                 <span class="text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-white transition-colors">
                   {{ requestingBolao === camp.id ? 'Enviando...' : 'Solicitar Acesso' }}
                 </span>
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
import BetMatchCard from '~/components/bet/BetMatchCard.vue'

// Composables
import { useRanking } from '~/composables/useRanking'
import { useBets } from '~/composables/useBets'

const { profile, user } = useAuth()
const supabase = useSupabaseClient<any>()
const router = useRouter()
const toast = useToast()

const isAdmin = computed(() => profile.value?.is_admin === true)
const { campeonatos, campeonatoAtivo, selecionarCampeonato } = useCampeonato()
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
  return rodada.value?.status === 'aguardando_escolha' && campeonatoAtivo.value?.formato !== 'copa'
})

const isPalpitesFechados = computed(() => {
  return !rodada.value || (rodada.value.status !== 'aberta' && rodada.value.status !== 'aguardando_escolha')
})

// Próximos 3 confrontos pendentes/não iniciados da rodada
const quickMatches = computed(() => {
  if (!sortedMatches.value) return []
  return sortedMatches.value
    .filter(m => new Date(m.data_partida).getTime() > new Date().getTime())
    .slice(0, 3)
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

const enterBolao = (id: string) => {
    selecionarCampeonato(id)
    router.push('/palpites')
}

// Sincronizar dados do cliente ao montar ou ao alterar campeonato ativo
onMounted(async () => {
  initActiveCampeonato()
  if (campeonatoAtivo.value && !isAdmin.value) {
    selectedCampId.value = campeonatoAtivo.value.id
    await Promise.all([
      fetchRanking(),
      fetchInitialData()
    ])
  }
})

watch(campeonatoAtivo, async (newCamp) => {
  if (process.client && newCamp && !isAdmin.value) {
    selectedCampId.value = newCamp.id
    await Promise.all([
      fetchRanking(),
      fetchInitialData()
    ])
  }
}, { immediate: true })

// Fetch on server-side to avoid layout shift
await useAsyncData('pending-requests', async () => {
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

