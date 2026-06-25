<script setup lang="ts">
import BaseBadge from '../ui/BaseBadge.vue'

interface Entry {
  usuario_id: string
  nome: string
  time_nome?: string
  escudo_url?: string
  total_pontos: number
  total_cravados: number
  total_acertos: number
  position: number
}

defineProps<{
  entries: Entry[]
  currentUserId?: string
}>()
</script>

<template>
  <div class="overflow-x-auto bg-white/5 border border-white/10 rounded-[2rem] shadow-2xl animate-fade-in-up">
    <table class="w-full text-left border-separate border-spacing-0">
      <thead>
        <tr class="bg-white/5 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
          <th class="px-4 sm:px-8 py-4 sm:py-6 text-center w-28 border-b border-white/10">Pos</th>
          <th class="px-4 sm:px-6 py-4 sm:py-6 border-b border-white/10">Competidor</th>
          <th class="px-4 py-4 sm:py-6 text-center border-b border-white/10 hidden sm:table-cell">Placares Exatos</th>
          <th class="px-4 py-4 sm:py-6 text-center border-b border-white/10 hidden sm:table-cell">Acertos Totais</th>
          <th class="px-4 sm:px-8 py-4 sm:py-6 text-center border-b border-white/10">Pontuação Total</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        <tr 
          v-for="entry in entries" 
          :key="entry.usuario_id"
          class="group transition-all hover:bg-white/[0.03]"
          :class="{ 'bg-brand-500/[0.05]': currentUserId === entry.usuario_id }"
        >
          <td class="px-4 sm:px-8 py-5 sm:py-8 text-center">
            <span class="font-bebas text-2xl sm:text-3xl" :class="entry.position <= 3 ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'">{{ entry.position }}º</span>
          </td>
          <td class="px-4 sm:px-6 py-5 sm:py-8">
            <div class="flex items-center gap-3 sm:gap-5">
              <div class="w-12 h-12 flex items-center justify-center shrink-0">
                <img v-if="entry.escudo_url" :src="entry.escudo_url" class="w-10 h-10 object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                <span v-else class="text-xl font-bebas text-gray-700 dark:text-gray-400">{{ entry.nome.charAt(0) }}</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-base text-gray-800 dark:text-gray-200">{{ entry.nome }}</span>
                  <BaseBadge v-if="currentUserId === entry.usuario_id" variant="brand">Você</BaseBadge>
                </div>
                <span class="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">{{ entry.time_nome || 'Sem Time' }}</span>
              </div>
            </div>
          </td>
          <td class="px-4 py-5 sm:py-8 text-center hidden sm:table-cell">
            <span class="text-gray-900 dark:text-white font-bebas text-xl sm:text-2xl">{{ entry.total_cravados }}</span>
          </td>
          <td class="px-4 py-5 sm:py-8 text-center hidden sm:table-cell">
            <span class="text-gray-600 dark:text-gray-400 font-bebas text-xl sm:text-2xl">{{ entry.total_acertos }}</span>
          </td>
          <td class="px-4 sm:px-8 py-5 sm:py-8 text-center">
            <span class="font-bebas text-3xl sm:text-4xl text-gray-900 dark:text-white">{{ entry.total_pontos }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
