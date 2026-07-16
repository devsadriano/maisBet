<template>
  <div class="space-y-10 animate-fade-in relative">
    
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-white/5 pb-8">
      <div class="space-y-2">
         <NuxtLink to="/" class="text-brand-400 text-xs font-black uppercase tracking-widest hover:text-brand-300 transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao Início
         </NuxtLink>
         <h1 class="text-4xl md:text-5xl font-bebas text-white tracking-tighter">Organizadores <span class="text-brand-500">das Rodadas</span></h1>
      </div>
      <div class="hidden md:block">
         <div class="w-16 h-16 bg-brand-500/10 rounded-2xl border border-brand-500/20 flex items-center justify-center">
            <span class="text-3xl">📋</span>
         </div>
      </div>
    </header>

    <!-- No Bolao State -->
    <div v-if="!campeonatoAtivo" class="animate-fade-in-up">
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
          <img v-if="campeonatoAtivo.logo_url" :src="campeonatoAtivo.logo_url" class="w-8 h-8 object-contain" />
          <h2 class="text-lg font-bebas text-white tracking-widest uppercase">{{ campeonatoAtivo.nome }}</h2>
        </div>
        <p class="text-gray-400 leading-relaxed text-sm md:text-base">
          Abaixo está o histórico de organizadores de cada rodada do campeonato. A regra do sistema escolhe automaticamente o participante com 
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

      <!-- List of rounds -->
      <div v-else class="space-y-6">
        
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

        <!-- Upcoming Organizers Timeline -->
        <div v-if="proximosOrganizadores.length > 0" class="space-y-4 animate-fade-in-up">
          <h3 class="text-xs font-black uppercase tracking-wider text-gray-400 px-1 flex items-center gap-2">
            <span>📅</span>
            Fila de Seleção (Próximas Rodadas)
          </h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              v-for="(round, idx) in proximosOrganizadores" 
              :key="round.id"
              class="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-between text-center relative overflow-hidden group hover:border-brand-500/30 transition-all duration-300"
            >
              <!-- Badge: Index Order -->
              <span 
                class="absolute top-3 left-3 text-[9px] font-black border px-2 py-0.5 rounded-md"
                :class="idx === 0 
                  ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' 
                  : 'bg-white/5 text-gray-400 border-white/10'"
              >
                {{ idx === 0 ? 'Atual' : `${Number(idx) + 1}º na fila` }}
              </span>

              <!-- Round Header -->
              <span class="font-bebas text-xl text-white tracking-widest mt-2">RODADA {{ round.numero_rodada }}</span>

              <!-- Shield/Crest -->
              <div class="my-4 w-14 h-14 flex items-center justify-center p-1 bg-black/35 rounded-full border border-white/5 shadow-inner transition-transform group-hover:scale-110 duration-300">
                <img 
                  v-if="round.escudo_url" 
                  :src="round.escudo_url" 
                  class="w-10 h-10 object-contain shrink-0" 
                />
                <span v-else class="text-2xl">👤</span>
              </div>

              <!-- Participant Info -->
              <div class="space-y-1 w-full">
                <p class="text-xs font-bold text-white uppercase tracking-wider truncate px-1">{{ round.nome || 'Definindo...' }}</p>
                <p class="text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate px-1">{{ round.time_nome || 'Sem Time' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter and controls -->
        <div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
          <span class="text-xs font-bold text-gray-400">Total de rodadas: <strong class="text-white">{{ auditReport.length }}</strong></span>
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

const { campeonatoAtivo } = useCampeonato()

const loading = ref(false)
const auditReport = ref<any[]>([])
const expandedRounds = ref<Set<string>>(new Set())
const onlyManual = ref(false)

const fetchReport = async () => {
  if (!campeonatoAtivo.value) return
  loading.value = true
  try {
    const data = await $fetch<{ auditReport: any[] }>('/api/app/organizadores', {
      query: { campeonato_id: campeonatoAtivo.value.id }
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

const proximosOrganizadores = computed(() => {
  // 1. Find the active round (first round that is 'aguardando_escolha' or 'aberta')
  const activeRound = auditReport.value.find((r: any) => r.status === 'aguardando_escolha' || r.status === 'aberta')
  if (!activeRound || !activeRound.candidates) return []

  // 2. The candidates list in activeRound is already sorted by priority.
  // We can map candidates to calculate future rounds they will organize.
  return activeRound.candidates.map((c: any, index: number) => {
    return {
      id: c.id,
      nome: c.nome,
      time_nome: c.time_nome,
      escudo_url: c.escudo_url,
      numero_rodada: activeRound.numero_rodada + index
    }
  }).slice(0, 4) // Show the next 4 in queue
})

watch(() => campeonatoAtivo.value?.id, () => {
  fetchReport()
}, { immediate: true })

useHead({
  title: 'Organizadores das Rodadas | +BET',
  meta: [
    { name: 'description', content: 'Histórico de organizadores de cada rodada do bolão.' }
  ]
})
</script>
