<template>
  <div class="space-y-10 pb-32 animate-fade-in relative">
    
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-white/5 pb-8">
      <div class="space-y-2">
         <NuxtLink to="/ranking" class="text-brand-400 text-xs font-black uppercase tracking-widest hover:text-brand-300 transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao Ranking
         </NuxtLink>
         <h1 class="text-4xl md:text-5xl font-bebas text-white tracking-tighter">REGULAMENTO <span class="text-brand-500">OFICIAL</span></h1>
      </div>
      <div class="hidden md:block">
         <div class="w-16 h-16 bg-brand-500/10 rounded-2xl border border-brand-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
         </div>
      </div>
    </header>

    <!-- No Bolao State -->
    <div v-if="!campeonatoAtivo" class="animate-fade-in-up">
      <BaseCard title="⚠️ Nenhum Bolão Selecionado" class="text-center">
          <div class="py-10">
              <span class="text-6xl mb-6 block drop-shadow-lg">🏟️</span>
              <h2 class="text-3xl font-bebas text-white mb-3 tracking-widest uppercase">Você está fora de campo</h2>
              <p class="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">Você precisa escolher um campeonato no Lobby antes de poder ver suas regras.</p>
          </div>
          <template #footer>
              <div class="flex justify-center">
                  <BaseButton variant="brand" @click="$router.push('/')">Ir para o Lobby</BaseButton>
              </div>
          </template>
      </BaseCard>
    </div>

    <!-- Dynamic Rules -->
    <div v-else class="space-y-12">
      <!-- Intro Card -->
      <BaseCard variant="pitch">
        <div class="flex items-center gap-4 mb-4">
          <img v-if="campeonatoAtivo.logo_url" :src="campeonatoAtivo.logo_url" class="w-8 h-8 object-contain" />
          <h2 class="text-lg font-bebas text-white tracking-widest uppercase">{{ campeonatoAtivo.nome }}</h2>
        </div>
        <p class="text-gray-400 leading-relaxed italic text-sm md:text-base">
          Abaixo estão descritas as regras definitivas deste campeonato e sistema, projetadas para garantir transparência nas classificações e apostas.
        </p>
      </BaseCard>

      <!-- Section 1: Composicao -->
      <BaseCard variant="pitch">
        <div class="flex flex-col sm:flex-row items-start gap-6">
           <div class="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-500 flex items-center justify-center font-bebas text-2xl shrink-0">1</div>
           <div class="space-y-4">
              <h2 class="text-2xl font-bebas text-white tracking-widest uppercase">Composição e Apostas</h2>
              <ul class="space-y-4 text-sm text-gray-400">
                 <template v-if="campeonatoAtivo.formato === 'copa'">
                    <li class="flex gap-3">
                      <span class="text-brand-500 font-bold">»</span>
                      <span><strong>Copa do Mundo / Torneios:</strong> Todas as partidas do campeonato e de todas as seleções são abertas para apostas.</span>
                    </li>
                    <li class="flex gap-3">
                      <span class="text-brand-500 font-bold">»</span>
                      <span><strong>Prazo Limite:</strong> O tempo para palpitar em cada rodada se encerra exatamente <strong>2 horas</strong> antes do início do primeiro jogo válido daquela rodada.</span>
                    </li>
                 </template>
                 <template v-else>
                    <li class="flex gap-3">
                      <span class="text-brand-500 font-bold">»</span>
                      <span><strong>Jogos Obrigatórios:</strong> O sistema marca automaticamente jogos como OBRIGATÓRIOS quando envolvem o Time do Coração de qualquer participante deste bolão.</span>
                    </li>
                    <li class="flex gap-3">
                      <span class="text-brand-500 font-bold">»</span>
                      <span><strong>Jogos Extras:</strong> Jogos de complemento (clássicos geralmente) que o Organizador da Rodada (sorteado) escolhe para aumentar os pontos.</span>
                    </li>
                    <li class="flex gap-3">
                      <span class="text-brand-500 font-bold">»</span>
                      <span><strong>Prazo Limite:</strong> 1 hora de tolerância antes do primeiro apito do árbitro na rodada para você enviar seus pitacos.</span>
                    </li>
                 </template>
              </ul>
           </div>
        </div>
      </BaseCard>

      <!-- Section 2: Pontuação -->
      <BaseCard variant="brand" class="border-brand-500/20 overflow-hidden">
        <div class="flex flex-col sm:flex-row items-start gap-6 relative z-10 w-full">
           <div class="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bebas text-2xl shrink-0">2</div>
           <div class="space-y-6 w-full">
              <h2 class="text-2xl font-bebas text-white tracking-widest uppercase">Sistema de Pontuação</h2>
              <p class="text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-wider">{{ campeonatoAtivo.scoring_system?.descricao || 'Padrão' }}</p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div class="p-6 bg-white/5 rounded-[2rem] border border-white/5 text-center flex flex-col justify-center">
                    <div class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">ERROU TUDO</div>
                    <div class="text-3xl font-bebas text-white">ERRO</div>
                    <div class="text-[10px] text-danger-400 font-black tracking-widest mt-2 border-t border-danger-500/10 pt-2">{{ scoringSystem.errou !== undefined ? scoringSystem.errou : 0 }} PONTOS</div>
                 </div>
                 <div class="p-6 bg-white/5 rounded-[2rem] border border-white/5 text-center flex flex-col justify-center">
                    <div class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">GANHADOR OU EMPATE</div>
                    <div class="text-3xl font-bebas text-white leading-none">RESULTADO CORRETO</div>
                    <div class="text-[10px] text-blue-400 font-black tracking-widest mt-2 border-t border-blue-500/10 pt-2">{{ scoringSystem.vencedor_correto !== undefined ? scoringSystem.vencedor_correto : 1 }} PONTOS</div>
                 </div>
                 <div class="p-6 bg-brand-500/10 rounded-[2rem] border border-brand-500/20 text-center flex flex-col justify-center shadow-lg">
                    <div class="text-[10px] font-black uppercase tracking-widest text-brand-400 mb-2">SÓ O PLACAR EXATO</div>
                    <div class="text-3xl font-bebas text-white">CRAVADO</div>
                    <div class="text-[10px] text-emerald-400 font-black tracking-widest mt-2 border-t border-emerald-500/20 pt-2">{{ scoringSystem.placar_exato !== undefined ? scoringSystem.placar_exato : 3 }} PONTOS</div>
                 </div>
              </div>
              <p class="text-[10px] text-gray-500 dark:text-white/30 uppercase tracking-[0.2em] text-center font-bold">As pontuações não se somam. O limite é a pontuação máxima acima ou multiplicado pelo peso da rodada.</p>
           </div>
        </div>
      </BaseCard>

      <!-- Section 3: Organizador / Especiais -->
      <BaseCard variant="pitch">
        <div class="flex flex-col sm:flex-row items-start gap-6">
           <div class="w-10 h-10 rounded-xl bg-white/5 text-white flex items-center justify-center font-bebas text-2xl shrink-0">3</div>
           <div class="space-y-3">
              <template v-if="campeonatoAtivo.formato === 'copa'">
                <h2 class="text-2xl font-bebas text-white tracking-widest uppercase">Os Palpites de Ouro</h2>
                <p class="text-sm text-gray-400 leading-relaxed max-w-2xl">
                   Na fase inicial da Copa, todos têm direito a realizar os PALPITES ESPECIAIS (ex: Campeão, Vice e Artilheiro). Eles ficam armazenados e travados até o final da competição, somando bônus gigantescos ao Ranking Final!
                </p>
              </template>
              <template v-else>
                <h2 class="text-2xl font-bebas text-white tracking-widest uppercase">O "Dito Cujo" da Rodada</h2>
                <p class="text-sm text-gray-400 leading-relaxed max-w-2xl">
                   Em campeonatos de liga, a cada nova rodada um participante assume o papel de Organizador, ficando responsável por montar a cartela com os jogos extras que complementam a rodada e afetam a todos. O rodízio é automático em ordem definida pelo robô. Tudo é transparente e auditável pelo app.
                </p>
              </template>
           </div>
        </div>
      </BaseCard>

      <!-- Section 4: THE BIG SHOW (PRIZES) -->
      <div class="space-y-8">
        <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-danger-500/20 text-danger-500 flex items-center justify-center font-bebas text-2xl shrink-0">4</div>
            <h2 class="text-3xl font-bebas text-white tracking-widest uppercase leading-none">O ACERTO DE CONTAS</h2>
        </div>

        <!-- Dynamic Custom Prize rules from Database -->
        <BaseCard v-if="campeonatoAtivo?.detalhes_premiacao" variant="brand" class="border-amber-500/30 overflow-hidden relative">
           <div class="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl opacity-50"></div>
           <div class="relative z-10 flex flex-col space-y-4">
             <div class="flex items-center gap-4 border-b border-amber-500/20 pb-3">
               <span class="text-3xl">💰</span>
               <h3 class="text-2xl font-bebas text-white tracking-widest uppercase">REGRAS DA PREMIAÇÃO</h3>
             </div>
             <p class="text-sm text-amber-100 whitespace-pre-wrap leading-relaxed">{{ campeonatoAtivo.detalhes_premiacao }}</p>
             <div class="pt-2">
                <span class="text-[10px] uppercase font-black tracking-widest text-amber-500">Regras oficiais configuradas pelo administrador</span>
             </div>
           </div>
        </BaseCard>

        <!-- Standard Fallback/Fun Rules if Not Specified or Add-on -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- O CAMPEÃO (GLÓRIA) -->
          <BaseCard variant="brand" class="border-amber-500/30 overflow-hidden group">
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            
            <div class="relative z-10 flex flex-col h-full space-y-8">
              <div class="flex items-center justify-between">
                 <div class="bg-amber-500 p-4 rounded-3xl shadow-xl shadow-amber-500/20 rotate-[-10deg] group-hover:rotate-0 transition-transform">
                    <span class="text-3xl">🏆</span>
                 </div>
                 <div class="text-right">
                    <span class="text-[11px] font-black uppercase tracking-[0.4em] text-amber-500 block">Status: Glória</span>
                    <span class="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">1º Colocado Geral</span>
                 </div>
              </div>
              
              <div class="space-y-2">
                <h3 class="text-4xl font-bebas text-white tracking-[0.1em]">O CAMPEÃO GERAL</h3>
                <p class="text-sm text-amber-800 dark:text-amber-100 uppercase font-black opacity-80 leading-snug">
                   Ganha de acordo com a premiação, e se for na Liga padrão escolhida pelo grupo, os outros pagam a conta. Simples assim.
                </p>
              </div>

              <div class="pt-6 border-t border-white/10 mt-auto">
                <p class="text-[10px] text-gray-500 leading-relaxed italic uppercase font-bold tracking-wider">
                  No fim, é sobre honra.
                </p>
              </div>
            </div>
          </BaseCard>

          <!-- O CHURRASQUEIRO (PUNIÇÃO) -->
          <BaseCard variant="pitch" class="border-danger-500/30 overflow-hidden bg-danger-500/5 group border-2">
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-danger-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            
            <div class="relative z-10 flex flex-col h-full space-y-8">
              <div class="flex items-center justify-between">
                 <div class="bg-danger-600 p-4 rounded-3xl shadow-xl shadow-danger-500/20 rotate-[10deg] group-hover:rotate-0 transition-transform">
                    <span class="text-3xl">🔥</span>
                 </div>
                 <div class="text-right">
                    <span class="text-[11px] font-black uppercase tracking-[0.4em] text-danger-500 block">Status: Castigo</span>
                    <span class="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Último Colocado</span>
                 </div>
              </div>
              
              <div class="space-y-2">
                <h3 class="text-4xl font-bebas text-white tracking-[0.1em] break-words">MESTRE CHURRASQUEIRO</h3>
                <p class="text-sm text-red-800 dark:text-danger-400 uppercase font-black leading-snug">
                   Assume a honra (e o castigo) de bancar as punições amigáveis!
                </p>
              </div>

              <div class="pt-6 border-t border-white/10 mt-auto">
                <p class="text-[10px] text-gray-500 leading-relaxed italic uppercase font-bold tracking-wider">
                  Terminou em último? Separe o carvão e coloque o avental.
                </p>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '~/components/ui/BaseButton.vue'
import BaseCard from '~/components/ui/BaseCard.vue'
import { useCampeonato } from '~/composables/useCampeonato'

const { campeonatoAtivo, scoringSystem } = useCampeonato()

// SEO
useHead({
  title: 'Regulamento Oficial | +BET',
  meta: [
    { name: 'description', content: 'As regras definitivas do bolão.' }
  ]
})
</script>
