<template>
  <div class="min-h-screen bg-[var(--bg-base)] flex flex-col md:flex-row relative overflow-hidden transition-colors duration-300">
    
    <!-- Global Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in transition-all">
      <div class="bg-gray-900 border border-white/10 p-10 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col items-center gap-6 transform scale-100">
        <div class="relative w-16 h-16">
          <div class="absolute inset-0 border-4 border-brand-500/20 rounded-full"></div>
          <div class="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center text-brand-400 text-xl font-black">+</div>
        </div>
        <div class="text-center">
          <span class="block text-brand-400 font-bebas tracking-[0.2em] text-2xl">
            ATUALIZANDO SENHA
          </span>
          <span class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 block">
            Aguarde um momento...
          </span>
        </div>
      </div>
    </div>

    <!-- Left Side: Branding / Visual (Visible only on desktop md+) -->
    <div class="hidden md:flex flex-col items-center justify-center w-1/2 p-12 relative overflow-hidden bg-brand-500">
      <!-- Decor -->
      <div class="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-black/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div class="relative z-10 text-center space-y-6">
        <!-- Logo animada -->
        <div class="inline-flex items-center justify-center w-28 h-28 bg-white/10 rounded-[2.5rem] rotate-12 backdrop-blur-sm border border-white/20 mb-6 group hover:rotate-0 transition-transform duration-500">
           <span class="text-white text-7xl font-bebas rotate-[-12deg] group-hover:rotate-0 transition-transform">+</span>
        </div>
        <h1 class="text-7xl font-bebas text-white tracking-[0.2em] leading-none drop-shadow-md">
          BET<span class="text-white/50">.</span>
        </h1>
        <div class="flex items-center justify-center gap-4 opacity-80">
          <div class="h-px w-12 bg-white/30"></div>
          <p class="text-white font-bold text-xs tracking-[0.4em] uppercase shadow-sm">The Official Betting Hub</p>
          <div class="h-px w-12 bg-white/30"></div>
        </div>
      </div>
    </div>

    <!-- Right Side: Reset Form -->
    <div class="w-full md:w-1/2 min-h-screen flex items-center justify-center p-6 relative">
      <!-- Mobile Blur Decor -->
      <div class="md:hidden absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-[var(--brand-glow)] rounded-full blur-[150px] pointer-events-none"></div>

      <div class="w-full max-w-[440px] relative z-10 space-y-10">
        <!-- Mobile Branding -->
        <div class="md:hidden text-center space-y-4 mb-10">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-[var(--brand)] rounded-2xl rotate-12 shadow-2xl mb-2">
             <span class="text-white text-4xl font-bebas rotate-[-12deg]">+</span>
          </div>
          <h1 class="text-5xl font-bebas text-[var(--text-primary)] tracking-[0.2em] leading-none">
            BET<span class="text-[var(--brand)]">.</span>
          </h1>
        </div>

        <!-- Card -->
        <BaseCard class="p-8 md:p-10 shadow-2xl bg-white dark:bg-[#161616]">
          <div class="mb-8">
            <h2 class="text-3xl font-bebas text-[var(--text-primary)] tracking-widest">
              CRIAR NOVA SENHA
            </h2>
            <p class="text-gray-500 dark:text-gray-400 text-xs mt-1 uppercase tracking-widest font-bold">
              Escolha uma nova senha forte para sua conta
            </p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-5">
            <!-- Password Field -->
            <div class="space-y-2 group">
              <label for="password" class="block text-[10px] font-black uppercase tracking-widest text-[var(--brand-light)] md:text-[var(--brand)] opacity-80 group-focus-within:opacity-100 transition-opacity">Nova Senha *</label>
              <input 
                id="password"
                v-model="form.password" 
                type="password" 
                required 
                placeholder="••••••••"
                class="w-full px-5 py-4 bg-gray-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl text-[var(--text-primary)] placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:bg-white dark:focus:bg-white/[0.07] transition-all duration-300"
                :disabled="loading"
              />
            </div>

            <!-- Confirm Password Field -->
            <div class="space-y-2 group">
              <label for="confirmPassword" class="block text-[10px] font-black uppercase tracking-widest text-[var(--brand-light)] md:text-[var(--brand)] opacity-80 group-focus-within:opacity-100 transition-opacity">Confirmar Nova Senha *</label>
              <input 
                id="confirmPassword"
                v-model="form.confirmPassword" 
                type="password" 
                required 
                placeholder="••••••••"
                class="w-full px-5 py-4 bg-gray-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl text-[var(--text-primary)] placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:bg-white dark:focus:bg-white/[0.07] transition-all duration-300"
                :disabled="loading"
              />
            </div>

            <!-- Messages -->
            <div v-if="errorMsg" class="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-[11px] font-bold uppercase tracking-wider text-center animate-shake">
              ⚠️ {{ errorMsg }}
            </div>
            
            <div v-if="successMsg" class="p-4 bg-green-50 dark:bg-[var(--brand-dim)] border border-green-200 dark:border-[color:var(--brand)] rounded-xl text-green-600 dark:text-[var(--brand)] text-[11px] font-bold uppercase tracking-wider text-center">
              ✅ {{ successMsg }}
            </div>

            <!-- Submit Button -->
            <BaseButton 
              type="submit" 
              variant="brand"
              class="w-full py-5 text-xl tracking-[0.2em]"
              :loading="loading"
            >
              DEFINIR NOVA SENHA
            </BaseButton>
          </form>
        </BaseCard>

        <!-- Footer Info -->
        <div class="text-center px-8">
          <p class="text-[9px] text-gray-500 dark:text-gray-600 font-bold uppercase tracking-[0.4em] leading-loose">
            Acesso restrito a usuários autorizados do sistema de bolão dinâmico PLFC. v4.1.0
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const { fetchProfile } = useAuth()

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const form = reactive({
  password: '',
  confirmPassword: ''
})

const handleSubmit = async () => {
  if (form.password !== form.confirmPassword) {
    errorMsg.value = 'As senhas não coincidem.'
    return
  }

  if (form.password.length < 6) {
    errorMsg.value = 'A senha deve ter pelo menos 6 caracteres.'
    return
  }

  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const { error } = await supabase.auth.updateUser({
      password: form.password
    })

    if (error) throw error

    successMsg.value = 'Senha alterada com sucesso! Redirecionando...'
    
    // Força atualização do perfil local e redireciona
    await fetchProfile()
    setTimeout(async () => {
      await navigateTo('/')
    }, 1500)
  } catch (err: any) {
    const msg = err.message || ''
    if (msg.includes('should be different')) {
      errorMsg.value = 'A nova senha deve ser diferente da senha antiga.'
    } else if (msg.includes('at least 6 characters')) {
      errorMsg.value = 'A senha deve ter pelo menos 6 caracteres.'
    } else if (msg.includes('rate limit')) {
      errorMsg.value = 'Muitas solicitações enviadas. Por favor, aguarde alguns minutos antes de tentar novamente.'
    } else {
      errorMsg.value = msg || 'Erro ao redefinir a senha.'
    }
  } finally {
    loading.value = false
  }
}

// SEO
useHead({
  title: '+BET | Alterar Senha',
  meta: [
    { name: 'description', content: 'Crie uma nova senha para sua conta no +BET.' }
  ]
})
</script>

<style scoped>
.animate-shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>
