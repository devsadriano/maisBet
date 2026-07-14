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

      <!-- Active Point Scoring System (Live values from DB) -->
      <BaseCard variant="brand" class="border-brand-500/20 overflow-hidden relative">
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/5 rounded-full blur-3xl opacity-50"></div>
        <div class="flex flex-col sm:flex-row items-start gap-6 relative z-10 w-full">
           <div class="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bebas text-2xl shrink-0">P</div>
           <div class="space-y-6 w-full">
              <h2 class="text-2xl font-bebas text-white tracking-widest uppercase">Pontuação Ativa</h2>
              <p class="text-gray-400 text-xs font-bold uppercase tracking-wider">{{ campeonatoAtivo.scoring_system?.descricao || 'Padrão' }}</p>
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
           </div>
        </div>
      </BaseCard>

      <!-- Rules Content Card -->
      <BaseCard variant="pitch" class="relative overflow-hidden">
        <div v-if="loadingRules" class="flex flex-col items-center justify-center py-20 space-y-4">
           <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
           <span class="text-gray-400 text-sm">Carregando regulamento oficial...</span>
        </div>
        <div v-else class="rules-markdown-content text-left" v-html="parsedRulesHtml"></div>
      </BaseCard>

      <!-- Dynamic Custom Prize rules from Database -->
      <BaseCard v-if="campeonatoAtivo?.detalhes_premiacao" variant="brand" class="border-amber-500/30 overflow-hidden relative">
         <div class="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl opacity-50"></div>
         <div class="relative z-10 flex flex-col space-y-4">
           <div class="flex items-center gap-4 border-b border-amber-500/20 pb-3">
             <span class="text-3xl">💰</span>
             <h3 class="text-2xl font-bebas text-white tracking-widest uppercase">REGRAS DA PREMIAÇÃO</h3>
           </div>
           <p class="text-sm text-amber-100 dark:text-amber-100 whitespace-pre-wrap leading-relaxed" style="color: inherit">{{ campeonatoAtivo.detalhes_premiacao }}</p>
           <div class="pt-2">
              <span class="text-[10px] uppercase font-black tracking-widest text-amber-500">Regras oficiais configuradas pelo administrador</span>
           </div>
         </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '~/components/ui/BaseButton.vue'
import BaseCard from '~/components/ui/BaseCard.vue'
import { useCampeonato } from '~/composables/useCampeonato'
import { ref, computed, watch } from 'vue'

const { campeonatoAtivo, scoringSystem, isCopaAtivo } = useCampeonato()

const isCopa = isCopaAtivo

// Busca dinâmica das regras markdown do backend
const rulesContent = ref('')
const loadingRules = ref(false)

const loadRules = async () => {
  if (!campeonatoAtivo.value) return
  loadingRules.value = true
  try {
    const data = await $fetch<{ content: string }>('/api/regras', {
      query: { isCopa: isCopa.value }
    })
    rulesContent.value = data.content
  } catch (error) {
    console.error('Erro ao buscar as regras:', error)
    rulesContent.value = 'Não foi possível carregar as regras deste campeonato.'
  } finally {
    loadingRules.value = false
  }
}

watch(() => campeonatoAtivo.value?.id, () => {
  loadRules()
}, { immediate: true })

// Parser markdown simples e limpo
const parsedRulesHtml = computed(() => {
  const md = rulesContent.value
  if (!md) return ''
  
  const lines = md.split('\n')
  let html = ''
  let inList = false
  let inTable = false
  let tableHeaders: string[] = []
  let tableRows: string[][] = []
  
  const flushList = () => {
    if (inList) {
      html += '</ul>'
      inList = false
    }
  }
  
  const flushTable = () => {
    if (inTable) {
      html += `
        <div class="overflow-x-auto my-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-white/5 border-b border-white/10">
      `
      tableHeaders.forEach(h => {
        html += `<th class="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-gray-400">${h}</th>`
      })
      html += `
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 text-sm text-gray-300">
      `
      tableRows.forEach(row => {
        html += '<tr>'
        row.forEach(cell => {
          html += `<td class="px-4 py-3">${cell}</td>`
        })
        html += '</tr>'
      })
      html += `
            </tbody>
          </table>
        </div>
      `
      inTable = false
      tableHeaders = []
      tableRows = []
    }
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? '').trim()
    
    // Check for table divider or row
    if (line.startsWith('|')) {
      flushList()
      const cells = line.split('|').map(c => c.trim()).filter((_, index, arr) => index > 0 && index < arr.length - 1)
      
      // Check if separator line
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        continue
      }
      
      if (!inTable) {
        inTable = true
        tableHeaders = cells
      } else {
        tableRows.push(cells)
      }
      continue
    } else {
      flushTable()
    }
    
    // Skip H1 title of markdown (we already have a page header)
    if (line.startsWith('# ')) {
      continue
    }
    
    // H2 Headings
    if (line.startsWith('## ')) {
      flushList()
      const text = line.substring(3)
      html += `<h2 class="text-2xl font-bebas text-brand-400 tracking-wider uppercase mt-8 mb-4 border-b border-white/5 pb-2">${text}</h2>`
      continue
    }
    
    // H3 Headings
    if (line.startsWith('### ')) {
      flushList()
      const text = line.substring(4)
      html += `<h3 class="text-lg font-bold text-white mt-6 mb-2">${text}</h3>`
      continue
    }
    
    // Blockquote
    if (line.startsWith('> ')) {
      flushList()
      const text = line.substring(2)
      html += `<blockquote class="border-l-4 border-brand-500 bg-brand-500/10 p-4 rounded-r-2xl my-4 text-sm text-gray-300 italic">${text}</blockquote>`
      continue
    }
    
    // Lists
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        html += '<ul class="list-none space-y-3 my-4">'
        inList = true
      }
      const text = line.substring(2)
      html += `<li class="flex gap-2 text-sm text-gray-300"><span class="text-brand-500 font-black">»</span> <span>${text}</span></li>`
      continue
    }
    
    // Numbered lists
    const numListMatch = line.match(/^(\d+)\.\s+(.*)/)
    if (numListMatch) {
      if (!inList) {
        html += '<ul class="list-none space-y-3 my-4">'
        inList = true
      }
      const num = numListMatch[1]
      const text = numListMatch[2]
      html += `<li class="flex gap-2 text-sm text-gray-300"><span class="text-brand-500 font-bold font-mono">${num}.</span> <span>${text}</span></li>`
      continue
    }
    
    if (line === '') {
      flushList()
      continue
    }
    
    // Paragraphs
    flushList()
    html += `<p class="text-sm text-gray-300 leading-relaxed my-3">${line}</p>`
  }
  
  flushList()
  flushTable()
  
  // Substitui negrito **texto** -> <strong>texto</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // Substitui código `code` -> <code class="...">code</code>
  html = html.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-black/40 text-brand-400 text-xs font-mono">$1</code>')
  
  return html
})

// SEO
useHead({
  title: 'Regulamento Oficial | +BET',
  meta: [
    { name: 'description', content: 'As regras definitivas do bolão.' }
  ]
})
</script>

<style scoped>
/* Estilos extras opcionais para estilizar elementos dentro do v-html caso necessário */
.rules-markdown-content :deep(strong) {
  color: var(--text-primary);
  font-weight: 700;
}
.rules-markdown-content :deep(td) {
  border-bottom: 1px solid var(--border);
}
.rules-markdown-content :deep(tr:last-child td) {
  border-bottom: none;
}

/* ── Light mode overrides para conteúdo gerado via v-html ── */
:root:not(.dark) .rules-markdown-content :deep(p),
:root:not(.dark) .rules-markdown-content :deep(li span:not(.text-brand-500)),
:root:not(.dark) .rules-markdown-content :deep(li) {
  color: var(--text-secondary) !important;
}

:root:not(.dark) .rules-markdown-content :deep(h3) {
  color: var(--text-primary) !important;
}

:root:not(.dark) .rules-markdown-content :deep(blockquote) {
  color: var(--text-secondary) !important;
  background-color: rgba(21, 128, 61, 0.06) !important;
}

:root:not(.dark) .rules-markdown-content :deep(th) {
  color: var(--text-muted) !important;
}

:root:not(.dark) .rules-markdown-content :deep(tbody) {
  color: var(--text-secondary) !important;
}

/* Card de premiação em modo claro */
html:not(.dark) .text-amber-100 {
  color: #92400e !important; /* amber-800 — legível no light */
}
</style>
