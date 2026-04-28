<template>
  <div class="space-y-12 pb-20 animate-fade-in">
    
    <!-- MAIN WELCOME CARDS (Hero) -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      <div class="md:col-span-12">
        <BaseCard variant="pitch" class="h-full">
          <div v-if="profile" class="space-y-10">
            <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 class="text-2xl md:text-3xl font-bebas tracking-tight text-gray-900 dark:text-white mb-1">
                  E AÍ, <span :class="isAdmin ? 'text-danger-400' : 'text-brand-600 dark:text-brand-400'">{{ profile.nome.split(' ')[0] }}</span>!
                </h1>
                <div class="flex items-center gap-2">
                  <div class="h-1.5 w-1.5 rounded-full animate-pulse" :class="isAdmin ? 'bg-danger-500' : 'bg-emerald-500'"></div>
                  <p class="text-[9px] font-black uppercase tracking-widest" :class="isAdmin ? 'text-danger-400' : 'text-emerald-400'">
                    Status: {{ isAdmin ? 'Administrador Plataforma' : 'Competidor Ativo' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Dashboard Overview Display -->
            <div v-if="!isAdmin" class="bg-white/[0.03] border border-white/5 p-10 rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-10 relative overflow-hidden group/team">
              <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-500/20 rounded-full blur-[80px] opacity-0 group-hover/team:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              
              <div class="relative group/shield shrink-0">
                <div class="absolute inset-0 bg-white/10 blur-2xl rounded-full scale-50 group-hover/shield:scale-125 transition-transform duration-700"></div>
                <div class="w-24 h-24 rounded-full bg-brand-500/10 flex items-center justify-center border border-brand-500/20 text-4xl font-bebas text-brand-500 shadow-inner">
                  {{ profile.nome[0] }}
                </div>
              </div>

              <div class="flex-1 text-center sm:text-left relative z-10 space-y-2">
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/10 rounded-full border border-brand-500/10 mb-2">
                  <span class="text-[9px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400">HUB CENTRAL</span>
                </div>
                <h3 class="text-3xl font-bebas text-gray-900 dark:text-white tracking-[0.1em] group-hover/team:text-brand-600 dark:group-hover/team:text-brand-400 transition-colors">SEUS BOLÕES</h3>
                <p class="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500 dark:text-white/50 mt-2 flex items-center justify-center sm:justify-start gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                   </svg>
                   Selecione um campeonato abaixo para palpitar
                </p>
              </div>
            </div>

            <!-- Admin Shortcut -->
            <div v-else class="bg-white/[0.03] border border-danger-500/20 p-10 rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-10 relative overflow-hidden group/admin hover:bg-danger-500/5 transition-all">
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

    <!-- HUB DE BOLÕES -->
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
          <button 
             v-for="camp in campeonatos.filter(c => c.status === 'ativo')" 
             :key="camp.id"
             @click="enterBolao(camp.id)"
             class="group relative flex flex-col text-left overflow-hidden bg-white dark:bg-[#151515] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-[2rem] border border-gray-200 dark:border-white/5 hover:border-brand-500/50 transition-all duration-500 outline-none focus-visible:ring-2 ring-brand-500 shadow-xl"
          >
             <!-- Decoration Flow -->
             <div class="absolute -top-16 -right-16 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-colors duration-500 pointer-events-none"></div>

             <div class="p-8 flex-1 w-full space-y-6 z-10">
                <!-- Escudo do Campeonato -->
                <div class="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center justify-center p-2 shadow-inner group-hover:scale-110 transition-transform duration-500 relative overflow-hidden">
                    <!-- Background Glow inside shield -->
                    <div class="absolute inset-0 bg-brand-500/5 group-hover:bg-brand-500/10 transition-colors"></div>
                    
                    <img 
                      v-if="camp.logo_url" 
                      :src="camp.logo_url" 
                      :alt="camp.nome" 
                      class="w-full h-full object-contain drop-shadow-lg relative z-10"
                      @error="(e) => (e.target as HTMLImageElement).src = 'https://crests.football-data.org/764.png'" 
                    >
                    <div v-else class="flex flex-col items-center justify-center relative z-10">
                       <span class="text-3xl filter grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all">🏆</span>
                       <span class="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter mt-1">{{ camp.api_competition_code }}</span>
                    </div>
                </div>

                <!-- Info -->
                <div>
                   <div class="flex items-center gap-2 mb-2">
                       <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-brand-500/10 text-brand-600 dark:text-brand-400">Ativo</span>
                       <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest shadow-sm">{{ camp.season || new Date().getFullYear() }}</span>
                   </div>
                   <h3 class="text-2xl font-bebas text-gray-900 dark:text-white tracking-widest group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{{ camp.nome }}</h3>
                   <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider text-[10px]">{{ camp.max_rodadas }} Rodadas Oficiais</p>
                </div>
             </div>

             <!-- Action Bar -->
             <div class="w-full bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 py-4 px-8 flex justify-between items-center z-10 group-hover:bg-brand-500 group-hover:border-brand-500 transition-colors duration-300">
                 <span class="text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 group-hover:text-white transition-colors">Acessar Bolão</span>
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                 </svg>
             </div>
          </button>
       </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// Base UI
import BaseCard from '@/components/ui/BaseCard.vue'

const { profile } = useAuth()
const supabase = useSupabaseClient<any>()
const router = useRouter()

const isAdmin = computed(() => profile.value?.is_admin === true)
const { campeonatos, campeonatoAtivo, selecionarCampeonato } = useCampeonato()

const enterBolao = (id: string) => {
    selecionarCampeonato(id)
    router.push('/palpites')
}

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
