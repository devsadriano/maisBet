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
          <th class="px-2 sm:px-8 py-4 sm:py-6 text-center w-14 sm:w-28 border-b border-white/10">Pos</th>
          <th class="px-2 sm:px-6 py-4 sm:py-6 border-b border-white/10">Competidor</th>
          <th class="px-4 py-4 sm:py-6 text-center border-b border-white/10 hidden sm:table-cell">Placares Exatos</th>
          <th class="px-4 py-4 sm:py-6 text-center border-b border-white/10 hidden sm:table-cell">Acertos Totais</th>
          <th class="px-2 sm:px-8 py-4 sm:py-6 text-center border-b border-white/10 w-20 sm:w-auto">
            <span class="hidden sm:inline">Pontuação Total</span>
            <span class="sm:hidden">Pts</span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        <tr 
          v-for="entry in entries" 
          :key="entry.usuario_id"
          class="group transition-all hover:bg-white/[0.03]"
          :class="{ 'bg-brand-500/[0.05]': currentUserId === entry.usuario_id }"
        >
          <td class="px-2 sm:px-8 py-4 sm:py-6 text-center">
            <span class="font-bebas text-xl sm:text-3xl" :class="entry.position <= 3 ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'">{{ entry.position }}º</span>
          </td>
          <td class="px-2 sm:px-6 py-4 sm:py-6">
            <div class="flex items-center gap-2 sm:gap-5">
              <div class="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
                <img v-if="entry.escudo_url" :src="entry.escudo_url" class="w-6 h-6 sm:w-10 sm:h-10 object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                <span v-else class="text-sm sm:text-xl font-bebas text-gray-700 dark:text-gray-400">{{ entry.nome.charAt(0) }}</span>
              </div>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-1 sm:gap-2">
                  <span class="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-200 truncate max-w-[130px] sm:max-w-none">{{ entry.nome }}</span>
                  <BaseBadge v-if="currentUserId === entry.usuario_id" variant="brand" class="text-[8px] sm:text-[10px]">Você</BaseBadge>
                </div>
                <span class="text-[9px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest block truncate max-w-[130px] sm:max-w-none">{{ entry.time_nome || 'Sem Time' }}</span>
              </div>
            </div>
          </td>
          <td class="px-4 py-5 sm:py-8 text-center hidden sm:table-cell">
            <span class="text-gray-900 dark:text-white font-bebas text-xl sm:text-2xl">{{ entry.total_cravados }}</span>
          </td>
          <td class="px-4 py-5 sm:py-8 text-center hidden sm:table-cell">
            <span class="text-gray-600 dark:text-gray-400 font-bebas text-xl sm:text-2xl">{{ entry.total_acertos }}</span>
          </td>
          <td class="px-2 sm:px-8 py-4 sm:py-6 text-center">
            <span class="font-bebas text-2xl sm:text-4xl text-gray-900 dark:text-white">{{ entry.total_pontos }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
