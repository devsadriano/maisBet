<template>
  <div class="space-y-8 animate-fade-in relative pb-8">

    <!-- Header -->
    <header class="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-8">
      <div class="space-y-2">
        <NuxtLink to="/ranking" class="text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-widest hover:text-brand-500 transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar ao Ranking
        </NuxtLink>
        <h1 class="text-4xl md:text-5xl font-bebas text-slate-900 dark:text-white tracking-tighter">
          REGULAMENTO <span class="text-brand-500">OFICIAL</span>
        </h1>
      </div>
      <div class="hidden md:block">
        <div class="w-16 h-16 bg-brand-500/10 rounded-2xl border border-brand-500/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      </div>
    </header>

    <!-- No Bolao State -->
    <div v-if="!campeonatoAtivo" class="animate-fade-in-up">
      <BaseCard title="⚠️ Nenhum Bolão Selecionado" class="text-center">
        <div class="py-10">
          <span class="text-6xl mb-6 block drop-shadow-lg">🏟️</span>
          <h2 class="text-3xl font-bebas text-slate-900 dark:text-white mb-3 tracking-widest uppercase">Você está fora de campo</h2>
          <p class="text-slate-600 dark:text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            Você precisa escolher um campeonato no Lobby antes de poder ver suas regras.
          </p>
        </div>
        <template #footer>
          <div class="flex justify-center">
            <BaseButton variant="brand" @click="$router.push('/')">Ir para o Lobby</BaseButton>
          </div>
        </template>
      </BaseCard>
    </div>

    <!-- Dynamic Rules -->
    <div v-else class="space-y-8">
      <!-- Intro / Championship Identity Card -->
      <BaseCard variant="pitch">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-3.5 min-w-0">
            <div v-if="campeonatoAtivo.logo_url" class="w-11 h-11 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 p-1.5 flex items-center justify-center shrink-0">
              <img :src="campeonatoAtivo.logo_url" :alt="campeonatoAtivo.nome" class="w-full h-full object-contain" />
            </div>
            <div class="min-w-0">
              <h2 class="text-xl font-bebas text-slate-900 dark:text-white tracking-widest uppercase truncate">
                {{ campeonatoAtivo.nome }}
              </h2>
              <p v-if="campeonatoAtivo.apelido_grupo" class="text-xs font-bold text-amber-600 dark:text-amber-400">
                📎 {{ campeonatoAtivo.apelido_grupo }}
              </p>
            </div>
          </div>

          <!-- Format, Rounds & Timezone Badges -->
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border"
              :class="activeFormato === 'copa'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'"
            >
              <span>{{ activeFormato === 'copa' ? '🌍' : '🏟️' }}</span>
              <span>{{ activeFormato === 'copa' ? 'Formato Copa' : 'Formato Liga' }}</span>
            </span>

            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/10">
              <span>🔢</span>
              <span>{{ activeMeta.max_rodadas }} Rodadas</span>
            </span>

            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/25">
              <span>🕒</span>
              <span>{{ activeMeta.fuso_label }}</span>
            </span>
          </div>
        </div>

        <p class="text-slate-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
          Abaixo estão descritas todas as regras oficiais que regem este campeonato no sistema <strong>+BET</strong>, garantindo total transparência nas rodadas, prazos, critérios de desempate e pontuações.
        </p>
      </BaseCard>

      <!-- Active Point Scoring System (Live values from DB) -->
      <BaseCard variant="brand" class="border-brand-500/20 overflow-hidden relative">
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/5 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div class="flex flex-col sm:flex-row items-start gap-6 relative z-10 w-full">
          <div class="w-10 h-10 rounded-xl bg-brand-500/15 dark:bg-white/10 text-brand-700 dark:text-white flex items-center justify-center font-bebas text-2xl shrink-0 border border-brand-500/20">P</div>
          <div class="space-y-6 w-full">
            <div>
              <h2 class="text-2xl font-bebas text-slate-900 dark:text-white tracking-widest uppercase">Pontuação Ativa</h2>
              <p class="text-slate-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mt-0.5">
                {{ campeonatoAtivo.scoring_system?.nome ? `${campeonatoAtivo.scoring_system.nome} — ` : '' }}{{ campeonatoAtivo.scoring_system?.descricao || 'Padrão' }}
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div class="p-6 bg-slate-50 dark:bg-white/5 rounded-[1.75rem] border border-slate-200 dark:border-white/5 text-center flex flex-col justify-center">
                <div class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2">ERROU OU NÃO PALPITOU</div>
                <div class="text-3xl font-bebas text-slate-900 dark:text-white">ERRO</div>
                <div class="text-[10px] text-red-600 dark:text-danger-400 font-black tracking-widest mt-2 border-t border-red-500/15 pt-2">
                  {{ formatPointsBadge(liveScoring.errou) }}
                </div>
              </div>

              <div class="p-6 bg-slate-50 dark:bg-white/5 rounded-[1.75rem] border border-slate-200 dark:border-white/5 text-center flex flex-col justify-center">
                <div class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2">GANHADOR OU EMPATE</div>
                <div class="text-3xl font-bebas text-slate-900 dark:text-white leading-none">RESULTADO CORRETO</div>
                <div class="text-[10px] text-blue-600 dark:text-blue-400 font-black tracking-widest mt-2 border-t border-blue-500/15 pt-2">
                  {{ formatPointsBadge(liveScoring.vencedor_correto) }}
                </div>
              </div>

              <div class="p-6 bg-brand-500/10 rounded-[1.75rem] border border-brand-500/25 text-center flex flex-col justify-center shadow-lg">
                <div class="text-[10px] font-black uppercase tracking-widest text-brand-700 dark:text-brand-400 mb-2">PLACAR EXATO</div>
                <div class="text-3xl font-bebas text-slate-900 dark:text-white">CRAVADO</div>
                <div class="text-[10px] text-emerald-700 dark:text-emerald-400 font-black tracking-widest mt-2 border-t border-emerald-500/20 pt-2">
                  {{ formatPointsBadge(liveScoring.placar_exato) }}
                </div>
              </div>
            </div>

            <!-- Copa Quick Summary: Multipliers & Special Bets -->
            <div v-if="activeFormato === 'copa'" class="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                <div class="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">
                  🔥 Multiplicadores no Mata-Mata
                </div>
                <div class="flex flex-wrap gap-2 text-xs font-bold text-slate-700 dark:text-gray-200">
                  <span class="px-2.5 py-1 rounded-lg bg-white/70 dark:bg-black/30 border border-amber-500/20">Grupos/Oitavas ×1.0</span>
                  <span class="px-2.5 py-1 rounded-lg bg-white/70 dark:bg-black/30 border border-amber-500/20">Quartas ×1.5</span>
                  <span class="px-2.5 py-1 rounded-lg bg-white/70 dark:bg-black/30 border border-amber-500/20">Semi ×2.0</span>
                  <span class="px-2.5 py-1 rounded-lg bg-white/70 dark:bg-black/30 border border-amber-500/20">Final ×3.0</span>
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                <div class="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                  🎯 Palpites Especiais (Bônus Geral)
                </div>
                <div class="flex flex-wrap gap-2 text-xs font-bold text-slate-700 dark:text-gray-200">
                  <span class="px-2.5 py-1 rounded-lg bg-white/70 dark:bg-black/30 border border-emerald-500/20">Campeão +10 pts</span>
                  <span class="px-2.5 py-1 rounded-lg bg-white/70 dark:bg-black/30 border border-emerald-500/20">Artilheiro +10 pts</span>
                  <span class="px-2.5 py-1 rounded-lg bg-white/70 dark:bg-black/30 border border-emerald-500/20">Melhor do Grupo +5 pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Scope Filter Tabs -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 class="text-2xl font-bebas text-slate-900 dark:text-white tracking-wider uppercase">
              Regras do Sistema & Competição
            </h2>
            <p class="text-xs text-slate-500 dark:text-gray-400">
              Exibindo automaticamente as regras válidas para o formato
              <strong class="text-slate-800 dark:text-white">{{ activeFormato === 'copa' ? 'Copa' : 'Campeonato / Liga' }}</strong> e regras gerais.
            </p>
          </div>
          <span class="text-[10px] font-black uppercase tracking-widest text-brand-700 dark:text-brand-400">
            Filtrar por categoria
          </span>
        </div>

        <div class="p-2.5 sm:p-3 rounded-3xl bg-slate-200/75 dark:bg-white/[0.03] border border-slate-300/80 dark:border-white/10 shadow-lg">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              @click="scopeFilter = 'all'"
              class="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.98]"
              :class="scopeFilter === 'all'
                ? 'bg-brand-600 dark:bg-brand-500 border-brand-500 dark:border-brand-400 text-slate-50 dark:text-slate-950 shadow-[0_0_24px_rgba(0,232,122,0.28)]'
                : 'bg-white dark:bg-white/[0.06] border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:border-brand-500/50 hover:bg-brand-500/10'"
            >
              <span class="flex items-center gap-2.5 min-w-0">
                <span class="text-base shrink-0">📋</span>
                <span class="text-xs font-black uppercase tracking-wider truncate">Regulamento Completo</span>
              </span>
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black shrink-0"
                :class="scopeFilter === 'all'
                  ? 'bg-black/20 text-slate-50 dark:text-slate-950'
                  : 'bg-slate-200 dark:bg-black/40 text-slate-700 dark:text-slate-300'"
              >
                {{ sections.length }}
              </span>
            </button>

            <button
              type="button"
              @click="scopeFilter = 'format'"
              class="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.98]"
              :class="scopeFilter === 'format'
                ? (activeFormato === 'copa'
                  ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-[0_0_24px_rgba(245,158,11,0.3)]'
                  : 'bg-blue-600 border-blue-400 text-slate-50 shadow-[0_0_24px_rgba(37,99,235,0.35)]')
                : 'bg-white dark:bg-white/[0.06] border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:border-blue-500/50 hover:bg-blue-500/10'"
            >
              <span class="flex items-center gap-2.5 min-w-0">
                <span class="text-base shrink-0">{{ activeFormato === 'copa' ? '🌍' : '🏟️' }}</span>
                <span class="text-xs font-black uppercase tracking-wider truncate">
                  {{ activeFormato === 'copa' ? 'Exclusivas da Copa' : 'Exclusivas da Liga' }}
                </span>
              </span>
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black shrink-0"
                :class="scopeFilter === 'format'
                  ? (activeFormato === 'copa' ? 'bg-black/15 text-slate-950' : 'bg-black/25 text-slate-50')
                  : 'bg-slate-200 dark:bg-black/40 text-slate-700 dark:text-slate-300'"
              >
                {{ formatSectionsCount }}
              </span>
            </button>

            <button
              type="button"
              @click="scopeFilter = 'geral'"
              class="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.98]"
              :class="scopeFilter === 'geral'
                ? 'bg-emerald-600 dark:bg-emerald-500 border-emerald-400 text-slate-50 dark:text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.32)]'
                : 'bg-white dark:bg-white/[0.06] border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 hover:bg-emerald-500/10'"
            >
              <span class="flex items-center gap-2.5 min-w-0">
                <span class="text-base shrink-0">📌</span>
                <span class="text-xs font-black uppercase tracking-wider truncate">Regras Gerais</span>
              </span>
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black shrink-0"
                :class="scopeFilter === 'geral'
                  ? 'bg-black/20 text-slate-50 dark:text-slate-950'
                  : 'bg-slate-200 dark:bg-black/40 text-slate-700 dark:text-slate-300'"
              >
                {{ geralSectionsCount }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <BaseCard v-if="loadingRules" variant="pitch">
        <div class="flex flex-col items-center justify-center py-20 space-y-4">
          <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
          <span class="text-slate-500 dark:text-gray-400 text-sm">Carregando regulamento oficial...</span>
        </div>
      </BaseCard>

      <!-- Error State -->
      <BaseCard v-else-if="rulesError" variant="pitch">
        <div class="py-10 text-center space-y-2">
          <p class="text-red-500 dark:text-red-400 font-bold text-sm">{{ rulesError }}</p>
        </div>
      </BaseCard>

      <!-- Structured Rule Cards -->
      <div v-else class="space-y-5">
        <BaseCard
          v-for="section in filteredSections"
          :key="section.id"
          variant="pitch"
          class="relative overflow-hidden transition-all"
        >
          <!-- Section Header -->
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-4 mb-5">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-lg shrink-0">
                {{ section.icon }}
              </div>
              <div class="min-w-0">
                <span class="text-[10px] font-mono font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest block">
                  Seção {{ section.number }}
                </span>
                <h3 class="text-xl sm:text-2xl font-bebas text-slate-900 dark:text-white tracking-wider uppercase leading-tight">
                  {{ section.title }}
                </h3>
              </div>
            </div>

            <span
              class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0"
              :class="scopeBadgeClass(section.scope)"
            >
              {{ section.badge }}
            </span>
          </div>

          <!-- Section Blocks -->
          <div class="space-y-4 text-left rules-section-body">
            <template v-for="(block, bIdx) in section.blocks" :key="bIdx">
              <!-- Paragraph -->
              <p
                v-if="block.type === 'paragraph'"
                class="text-sm text-slate-700 dark:text-gray-300 leading-relaxed"
                v-html="formatInline(block.text)"
              ></p>

              <!-- List -->
              <ul v-else-if="block.type === 'list'" class="list-none space-y-3">
                <li
                  v-for="(item, iIdx) in block.items"
                  :key="iIdx"
                  class="flex items-start gap-2.5 text-sm text-slate-700 dark:text-gray-300 leading-relaxed"
                >
                  <span
                    class="shrink-0 font-black mt-0.5"
                    :class="block.ordered ? 'font-mono text-brand-600 dark:text-brand-400 text-xs min-w-[1.25rem]' : 'text-brand-600 dark:text-brand-500'"
                  >
                    {{ block.ordered ? `${iIdx + 1}.` : '»' }}
                  </span>
                  <span v-html="formatInline(item)"></span>
                </li>
              </ul>

              <!-- Callout -->
              <div
                v-else-if="block.type === 'callout'"
                class="p-4 sm:p-5 rounded-2xl border-l-4 space-y-1.5"
                :class="calloutClass(block.variant)"
              >
                <div class="text-xs font-black uppercase tracking-wider" :class="calloutTitleClass(block.variant)">
                  {{ block.title }}
                </div>
                <p
                  class="text-sm text-slate-700 dark:text-gray-200 leading-relaxed"
                  v-html="formatInline(block.text)"
                ></p>
              </div>

              <!-- Table -->
              <div
                v-else-if="block.type === 'table'"
                class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]"
              >
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                      <th
                        v-for="(header, hIdx) in block.headers"
                        :key="hIdx"
                        class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-gray-400 whitespace-nowrap"
                      >
                        {{ header }}
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200 dark:divide-white/5 text-sm text-slate-700 dark:text-gray-300">
                    <tr v-for="(row, rIdx) in block.rows" :key="rIdx">
                      <td
                        v-for="(cell, cIdx) in row"
                        :key="cIdx"
                        class="px-4 py-3 whitespace-nowrap"
                        v-html="formatInline(cell)"
                      ></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </div>
        </BaseCard>
      </div>

      <!-- Dynamic Custom Prize rules from Database -->
      <BaseCard variant="brand" class="border-amber-500/30 overflow-hidden relative">
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div class="relative z-10 flex flex-col space-y-4">
          <div class="flex items-center gap-4 border-b border-amber-500/20 pb-3">
            <span class="text-3xl">💰</span>
            <div>
              <h3 class="text-2xl font-bebas text-slate-900 dark:text-white tracking-widest uppercase">REGRAS DA PREMIAÇÃO</h3>
              <span class="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Exclusivo deste bolão{{ campeonatoAtivo.apelido_grupo ? ` (${campeonatoAtivo.apelido_grupo})` : '' }}
              </span>
            </div>
          </div>

          <div
            v-if="campeonatoAtivo?.detalhes_premiacao"
            class="rules-prize-content text-sm text-slate-700 dark:text-amber-100 leading-relaxed space-y-3"
            v-html="parsedPrizeHtml"
          ></div>

          <p v-else class="text-sm text-slate-600 dark:text-gray-400 italic">
            As regras de premiação deste campeonato são definidas em comum acordo pelo administrador e participantes do grupo.
          </p>

          <div class="pt-2 border-t border-amber-500/15">
            <span class="text-[10px] uppercase font-black tracking-widest text-amber-600 dark:text-amber-500">
              Regras estabelecidas e aprovadas em comum acordo pelos participantes
            </span>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseButton from '~/components/ui/BaseButton.vue'
import BaseCard from '~/components/ui/BaseCard.vue'
import { useCampeonato } from '~/composables/useCampeonato'
import type { RuleScope, RuleSection, RulesResponse } from '~~/server/api/regras'

const { campeonatoAtivo, scoringSystem, isCopaAtivo, fusoHorarioAtivo } = useCampeonato()

const loadingRules = ref(false)
const rulesError = ref('')
const rulesPayload = ref<RulesResponse | null>(null)
const scopeFilter = ref<'all' | 'format' | 'geral'>('all')

const loadRules = async () => {
  if (!campeonatoAtivo.value) return
  loadingRules.value = true
  rulesError.value = ''
  try {
    const data = await $fetch<RulesResponse>('/api/regras', {
      query: {
        campeonato_id: campeonatoAtivo.value.id,
        isCopa: isCopaAtivo.value
      }
    })
    rulesPayload.value = data
  } catch (error) {
    console.error('Erro ao buscar as regras:', error)
    rulesError.value = 'Não foi possível carregar as regras deste campeonato.'
  } finally {
    loadingRules.value = false
  }
}

watch(
  () => campeonatoAtivo.value?.id,
  () => {
    scopeFilter.value = 'all'
    loadRules()
  },
  { immediate: true }
)

const activeFormato = computed<'liga' | 'copa'>(() => {
  if (rulesPayload.value?.formato) return rulesPayload.value.formato
  return isCopaAtivo.value ? 'copa' : 'liga'
})

const activeMeta = computed(() => {
  if (rulesPayload.value?.meta) return rulesPayload.value.meta
  return {
    max_rodadas: campeonatoAtivo.value?.max_rodadas || (isCopaAtivo.value ? 7 : 38),
    fuso_horario: fusoHorarioAtivo.value || 'America/Sao_Paulo',
    fuso_label: fusoHorarioAtivo.value || 'America/Sao_Paulo',
    scoring: {
      placar_exato: scoringSystem.value?.placar_exato ?? 3,
      vencedor_correto: scoringSystem.value?.vencedor_correto ?? 1,
      errou: scoringSystem.value?.errou ?? 0
    }
  }
})

const liveScoring = computed(() => ({
  errou: scoringSystem.value?.errou !== undefined ? scoringSystem.value.errou : activeMeta.value.scoring.errou,
  vencedor_correto: scoringSystem.value?.vencedor_correto !== undefined ? scoringSystem.value.vencedor_correto : activeMeta.value.scoring.vencedor_correto,
  placar_exato: scoringSystem.value?.placar_exato !== undefined ? scoringSystem.value.placar_exato : activeMeta.value.scoring.placar_exato
}))

const formatPointsBadge = (pts: number) => `${pts} ${Number(pts) === 1 ? 'PONTO' : 'PONTOS'}`

const sections = computed<RuleSection[]>(() => rulesPayload.value?.sections || [])

const formatSectionsCount = computed(() =>
  sections.value.filter(s => s.scope === activeFormato.value).length
)

const geralSectionsCount = computed(() =>
  sections.value.filter(s => s.scope === 'geral').length
)

const filteredSections = computed(() => {
  if (scopeFilter.value === 'format') {
    return sections.value.filter(s => s.scope === activeFormato.value)
  }
  if (scopeFilter.value === 'geral') {
    return sections.value.filter(s => s.scope === 'geral')
  }
  return sections.value
})

const scopeBadgeClass = (scope: RuleScope) => {
  if (scope === 'copa') {
    return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
  }
  if (scope === 'liga') {
    return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
  }
  return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
}

const calloutClass = (variant: 'brand' | 'amber' | 'blue') => {
  if (variant === 'amber') {
    return 'border-amber-500 bg-amber-500/10'
  }
  if (variant === 'blue') {
    return 'border-blue-500 bg-blue-500/10'
  }
  return 'border-brand-500 bg-brand-500/10'
}

const calloutTitleClass = (variant: 'brand' | 'amber' | 'blue') => {
  if (variant === 'amber') {
    return 'text-amber-700 dark:text-amber-300'
  }
  if (variant === 'blue') {
    return 'text-blue-700 dark:text-blue-300'
  }
  return 'text-brand-700 dark:text-brand-400'
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatInline(raw: string): string {
  let out = escapeHtml(raw)
  out = out.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
  out = out.replace(/\*(.*?)\*/g, '<em class="italic opacity-90">$1</em>')
  out = out.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-black/40 text-brand-700 dark:text-brand-400 text-xs font-mono font-bold">$1</code>')
  return out
}

const parsedPrizeHtml = computed(() => {
  const raw = campeonatoAtivo.value?.detalhes_premiacao
  if (!raw) return ''

  const lines = raw.split('\n')
  let html = ''
  let inList = false

  const flushList = () => {
    if (inList) {
      html += '</ul>'
      inList = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? '').trim()
    if (!line) {
      flushList()
      continue
    }

    // Remove eventual cabeçalho redundante "Premiações" no topo do texto livre
    if (/^#{1,3}\s+.*premia[cç][oõãa]/i.test(line)) {
      continue
    }

    if (line.startsWith('## ') || line.startsWith('### ')) {
      flushList()
      const title = line.replace(/^#{2,3}\s+/, '')
      html += `<h4 class="text-base font-bold text-slate-900 dark:text-amber-200 mt-3 mb-1">${formatInline(title)}</h4>`
      continue
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        html += '<ul class="list-none space-y-2.5">'
        inList = true
      }
      const itemText = line.substring(2)
      html += `<li class="flex items-start gap-2.5"><span class="text-amber-600 dark:text-amber-400 font-black mt-0.5 shrink-0">»</span><span>${formatInline(itemText)}</span></li>`
      continue
    }

    flushList()
    html += `<p>${formatInline(line)}</p>`
  }

  flushList()
  return html
})

useHead({
  title: 'Regulamento Oficial | +BET',
  meta: [
    { name: 'description', content: 'As regras definitivas do bolão.' }
  ]
})
</script>
