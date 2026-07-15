<template>
  <div class="flex flex-col relative w-full pb-32 space-y-8">
      
      <!-- Back Link -->
      <div class="flex items-center justify-between">
        <NuxtLink to="/ranking" class="text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white flex items-center gap-2 transition-all group">
          <div class="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-all border border-white/10 group-hover:border-brand-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
          </div>
          Voltar ao Ranking
        </NuxtLink>
      </div>

      <!-- No Bolao State -->
      <div v-if="!campeonatoAtivo" class="animate-fade-in-up">
        <BaseCard title="⚠️ Nenhum Bolão Selecionado" class="text-center">
            <div class="py-10">
                <span class="text-6xl mb-6 block drop-shadow-lg">🏟️</span>
                <h2 class="text-3xl font-bebas text-white mb-3 tracking-widest uppercase">Você está fora de campo</h2>
                <p class="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">Você precisa escolher um campeonato no Lobby antes de poder jogar ou ver o ranking.</p>
            </div>
            <template #footer>
                <div class="flex justify-center">
                    <BaseButton variant="brand" @click="$router.push('/')">Ir para o Lobby de Campeonatos</BaseButton>
                </div>
            </template>
        </BaseCard>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="flex flex-col items-center justify-center py-32 animate-fade-in">
        <div class="w-14 h-14 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(14,165,233,0.3)]"></div>
        <p class="text-brand-400 font-bebas text-2xl tracking-[0.2em] animate-pulse">Sincronizando Jogos...</p>
      </div>

      <!-- Empty/Closed State -->
      <div v-else-if="!rodada || (rodada.status !== 'aberta' && rodada.status !== 'aguardando_escolha')" class="animate-fade-in-up">
        <BaseCard class="text-center">
            <div class="py-10">
                <span class="text-6xl mb-6 block drop-shadow-lg">🔒</span>
                <h2 class="text-3xl font-bebas text-white mb-3 tracking-widest uppercase">Palpites Encerrados</h2>
                <p class="text-gray-400 text-sm max-w-md mx-auto leading-relaxed mb-6">Não há rodadas abertas para novos palpites no momento. Acompanhe os resultados no Ranking!</p>
                <div class="flex justify-center">
                    <BaseButton variant="brand" @click="$router.push('/ranking')">Ver Classificação</BaseButton>
                </div>
            </div>
        </BaseCard>
      </div>

      <!-- Aguardando Escolha State (LIGA ONLY) -->
      <div v-else-if="rodada && rodada.status === 'aguardando_escolha' && !isCopa" class="animate-fade-in-up">
        <BaseCard class="text-center">
            <div class="py-10">
                <!-- Organizer View -->
                <template v-if="profile?.id === rodada.organizer_id">
                  <span class="text-6xl mb-6 block drop-shadow-lg">⚙️</span>
                  <h2 class="text-3xl font-bebas text-white mb-3 tracking-widest uppercase">
                    Você é o Organizador!
                  </h2>
                  <p class="text-gray-400 text-sm max-w-md mx-auto leading-relaxed mb-2">
                    Você foi sorteado para escolher os {{ rodada.required_extra_games }} jogos extras da Rodada {{ rodada.numero_rodada }}.
                  </p>
                  <div v-if="rodada.organizer_deadline" class="flex items-center justify-center text-center gap-2.5 px-4 py-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl mb-6 max-w-md mx-auto">
                    <span class="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0"></span>
                    <span class="text-xs font-mono text-orange-400 leading-relaxed text-center">Se não escolher até {{ formatAutoSelectTime(rodada.organizer_deadline) }}, o sistema escolherá automaticamente</span>
                  </div>
                  <div class="flex justify-center">
                      <BaseButton variant="brand" @click="isOrganizerModalOpen = true">Organizar Partidas Extras</BaseButton>
                  </div>
                </template>

                <!-- Non-Organizer View -->
                <template v-else>
                  <span class="text-6xl mb-6 block drop-shadow-lg">⏳</span>
                  <h2 class="text-3xl font-bebas text-white mb-3 tracking-widest uppercase">
                    Aguardando Organizador
                  </h2>
                  <p class="text-gray-400 text-sm max-w-md mx-auto leading-relaxed mb-4">
                    A Rodada {{ rodada.numero_rodada }} está aguardando o organizador 
                    <span v-if="rodada.organizador?.nome" class="font-bold text-white">{{ rodada.organizador.nome }}</span>
                    escolher as partidas extras. Volte mais tarde!
                  </p>
                  <div v-if="rodada.organizer_deadline" class="flex items-center justify-center text-center gap-2.5 px-4 py-3 bg-brand-500/10 border border-brand-500/20 rounded-2xl max-w-md mx-auto">
                    <span class="w-2 h-2 rounded-full bg-brand-500 animate-pulse shrink-0"></span>
                    <span class="text-xs font-mono text-brand-400 leading-relaxed text-center">Se não escolher a tempo, o sistema seleciona automaticamente às {{ formatAutoSelectTime(rodada.organizer_deadline) }}</span>
                  </div>
                </template>
            </div>
        </BaseCard>
        
        <ModalOrganizer 
            :open="isOrganizerModalOpen"
            @close="isOrganizerModalOpen = false"
            @saved="fetchInitialData"
            :rodada="rodada"
            :organizer-id="profile?.id || ''"
        />
      </div>

      <!-- Active Round UI -->
      <div v-else class="space-y-10">
        
        <!-- Header Component -->
        <BetHeader 
            :round-number="rodada.numero_rodada"
            :time-remaining="timeRemaining"
            :is-locked="locked"
        >
          <template #extra v-if="rodada.fase && rodada.fase !== 'grupos'">
            <div class="flex items-center gap-2 px-4 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full">
              <span class="text-[10px] font-black uppercase tracking-widest text-brand-400">{{ rodada.fase }}</span>
            </div>
          </template>
        </BetHeader>

        <!-- Special Bets (Copa Only) -->
        <div v-if="isCopa" class="animate-fade-in-up">
          <SpecialBetsCard :campeonato-id="campeonatoAtivo.id" :is-locked="locked" />
        </div>

        <!-- Info Banner (Integrated) -->
        <div class="bg-brand-500/5 border border-brand-500/20 rounded-3xl p-6 flex flex-col md:flex-row gap-4 items-center animate-fade-in shadow-inner overflow-hidden relative">
            <div class="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-[100px] rounded-full -mr-16 -mt-16" />
            <div class="flex-shrink-0 w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-400 text-2xl drop-shadow-glow">💡</div>
            <div class="flex-grow">
              <p class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed relative z-10 text-center md:text-left">
                  Os jogos estão prontos! O <strong class="text-gray-900 dark:text-white">Placar Exato</strong> vale <strong class="text-brand-600 dark:text-brand-400">3 pontos</strong> e 
                  acertar o <strong class="text-gray-900 dark:text-white">vencedor/empate</strong> vale <strong class="text-emerald-600 dark:text-emerald-400">1 ponto</strong>.<br/>
                  <span v-if="rodada.multiplicador && rodada.multiplicador > 1" class="text-brand-400 font-bold text-xs uppercase tracking-wider mt-1 block">
                    🔥 RODADA COM PESO {{ rodada.multiplicador }}x! Todos os pontos desta rodada serão multiplicados.
                  </span>
                  <span class="text-orange-400 font-bold text-[11px] uppercase tracking-wider mt-2 block">
                    Cuidado: Os palpites encerram exatamente <strong>1 hora</strong> antes do primeiro jogo. Jogue agora!
                  </span>
              </p>
            </div>
        </div>

        <!-- Matches Grid -->
        <div class="space-y-10 pb-20 animate-fade-in-up">
          <div v-for="(matchesNoGrupo, nomeGrupo) in groupedMatches" :key="nomeGrupo" class="bg-white/[0.04] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            
            <!-- Group Header (only shown if copa and we have actual groups) -->
            <div v-if="isCopa && nomeGrupo !== 'Mata-Mata'" class="bg-white/5 py-4 px-6 text-center border-b border-white/10 relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-r from-brand-600/20 to-transparent mix-blend-overlay"></div>
              <h3 class="text-sm font-black uppercase tracking-[0.2em] text-white relative z-10">{{ nomeGrupo }}</h3>
            </div>

            <div class="divide-y divide-white/5">
              <BetMatchCard 
                v-for="jogo in matchesNoGrupo" 
                :key="jogo.id"
                :match="jogo"
                :model-value="bets[jogo.id] || { id: null, gols_casa_bet: 0, gols_fora_bet: 0 }"
                @update:model-value="val => bets[jogo.id] = val"
                :shield-home="jogo.api_team_home_id != null ? escudosMap[jogo.api_team_home_id] : undefined"
                :shield-away="jogo.api_team_away_id != null ? escudosMap[jogo.api_team_away_id] : undefined"
                :is-locked="locked"
              />
            </div>
          </div>
        </div>
      </div>

    <!-- Floating Save Bar -->
    <BetSaveBar 
        v-if="rodada && rodada.status === 'aberta'"
        :is-saving="salvando"
        :is-locked="locked"
        @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useBets } from '~/composables/useBets'
import { useToast } from '~/composables/useToast'
import { useCampeonato } from '~/composables/useCampeonato'

// Standard UI Components
import BaseButton from '~/components/ui/BaseButton.vue'
import BaseCard from '~/components/ui/BaseCard.vue'

// Local Betting Components
import BetHeader from '~/components/bet/BetHeader.vue'
import BetMatchCard from '~/components/bet/BetMatchCard.vue'
import BetSaveBar from '~/components/bet/BetSaveBar.vue'
import SpecialBetsCard from '~/components/bet/SpecialBetsCard.vue'
import ModalOrganizer from '~/components/ModalOrganizer.vue'


const { 
  rodada, 
  loading, 
  salvando, 
  locked, 
  bets, 
  escudosMap, 
  timeRemaining, 
  fetchInitialData, 
  saveAllBets, 
  sortedMatches 
} = useBets()

const { profile } = useAuth()
const { campeonatoAtivo, isCopaAtivo } = useCampeonato()
const isCopa = isCopaAtivo

const isOrganizerModalOpen = ref(false)

// Carregamento assíncrono não-bloqueante para navegação instantânea
useLazyAsyncData('init-palpites', async () => {
    if (profile.value?.is_admin === true) {
      if (process.server) {
        return navigateTo('/admin')
      } else {
        navigateTo('/admin')
        return true
      }
    }
    await fetchInitialData()
    return true
})

const groupedMatches = computed(() => {
  if (!sortedMatches.value) return {}
  
  if (isCopa.value) {
    const groups: Record<string, typeof sortedMatches.value> = {}
    sortedMatches.value.forEach(match => {
      const g = match.grupo || 'Mata-Mata'
      if (!groups[g]) groups[g] = []
      groups[g].push(match)
    })
    return groups
  }
  
  return { 'Partidas': sortedMatches.value }
})

watch(campeonatoAtivo, () => {
    fetchInitialData()
})

const { success: toastSuccess, error: toastError } = useToast()

const handleSave = async () => {
    const result = await saveAllBets()
    if (result && result.success) {
        toastSuccess('🎯 Palpites salvos com sucesso! Boa sorte!')
    } else if (result) {
        let msg = result.message || ''
        if (msg.includes('row-level security') || msg.includes('policy')) {
          msg = 'Aguarde a escolha do organizador! A rodada ainda não está aberta para palpitar.'
        }
        toastError('Erro ao salvar: ' + msg)
    }
}

// Helper: formata o horário da seleção automática
const formatAutoSelectTime = (iso: string) => {
  if (!iso) return '-'
  const raw = new Date(iso).toLocaleString('pt-BR', {
    weekday: 'long', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).replace(',', ' -')
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

// SEO
useHead({
  title: 'Meus Palpites | +BET',
  meta: [
    { name: 'description', content: 'Deixe seus palpites para a rodada atual do campeonato.' }
  ]
})
</script>

<style scoped>
.drop-shadow-glow {
  filter: drop-shadow(0 0 8px rgba(14, 165, 233, 0.4));
}
</style>
