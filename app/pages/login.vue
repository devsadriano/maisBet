<template>
  <div class="min-h-screen bg-[var(--bg-base)] flex flex-col md:flex-row relative overflow-hidden transition-colors duration-300">
    
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

    <!-- Right Side: Login Form -->
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

        <!-- Auth Card -->
        <BaseCard class="p-8 md:p-10 shadow-2xl bg-white dark:bg-[#161616]">
          <div class="mb-8">
            <h2 class="text-3xl font-bebas text-[var(--text-primary)] tracking-widest">{{ isLoginMode ? 'ACESSAR CONTA' : 'CRIAR ACESSO' }}</h2>
            <p class="text-gray-500 dark:text-gray-400 text-xs mt-1 uppercase tracking-widest font-bold">Inicie sua jornada no Brasileirão</p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Name Field (Register) -->
            <div v-if="!isLoginMode" class="space-y-2 group">
              <label for="nome" class="block text-[10px] font-black uppercase tracking-widest text-[var(--brand-light)] md:text-[var(--brand)] opacity-80 group-focus-within:opacity-100 transition-opacity">Seu Nome Completo</label>
              <input 
                id="nome"
                v-model="form.nome" 
                type="text" 
                required 
                placeholder="Ex: Adriano Rocha"
                class="w-full px-5 py-4 bg-gray-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl text-[var(--text-primary)] placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:bg-white dark:focus:bg-white/[0.07] transition-all duration-300"
                :disabled="loading"
              />
            </div>

            <!-- Email Field -->
            <div class="space-y-2 group">
              <label for="email" class="block text-[10px] font-black uppercase tracking-widest text-[var(--brand-light)] md:text-[var(--brand)] opacity-80 group-focus-within:opacity-100 transition-opacity">E-mail Autorizado</label>
              <input 
                id="email"
                v-model="form.email" 
                type="email" 
                required 
                placeholder="seu@email.com"
                class="w-full px-5 py-4 bg-gray-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl text-[var(--text-primary)] placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:bg-white dark:focus:bg-white/[0.07] transition-all duration-300"
                :disabled="loading"
              />
            </div>

            <!-- Password Field -->
            <div class="space-y-2 group">
              <label for="password" class="block text-[10px] font-black uppercase tracking-widest text-[var(--brand-light)] md:text-[var(--brand)] opacity-80 group-focus-within:opacity-100 transition-opacity">Sua Senha</label>
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
              {{ isLoginMode ? 'ENTRAR AGORA' : 'FINALIZAR CADASTRO' }}
            </BaseButton>
          </form>

          <!-- Toggle Mode -->
          <div class="mt-10 border-t border-black/5 dark:border-[var(--border)] pt-8 text-center">
            <button 
              type="button"
              @click="toggleMode"
              class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-[var(--brand)] transition-colors"
            >
              {{ isLoginMode ? 'NÃO TEM CONTA? SOLICITE ACESSO' : 'JÁ POSSUI ACESSO? FAÇA LOGIN' }}
            </button>
          </div>
        </BaseCard>

        <!-- Footer Info -->
        <div class="text-center px-8">
          <p class="text-[9px] text-gray-500 dark:text-gray-600 font-bold uppercase tracking-[0.4em] leading-loose">
            Acesso restrito a usuários autorizados do sistema de bolão dinâmico PLFC. v4.0.2
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

const { login, register } = useAuth()

const isLoginMode = ref(true)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const form = reactive({
  email: '',
  password: '',
  nome: ''
})

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  errorMsg.value = ''
  successMsg.value = ''
  form.password = ''
}

const handleSubmit = async () => {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    if (isLoginMode.value) {
      await login(form.email, form.password)
    } else {
      if (form.password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres.')
      }
      await register(form.email, form.password, form.nome)
    }
    
    // Sucesso no login ou registro redireciona para a home
    await navigateTo('/')
    
  } catch (err: any) {
    if (err.message?.includes('Invalid login credentials')) {
      errorMsg.value = 'E-mail ou senha incorretos.'
    } else {
      errorMsg.value = err.message || 'Ocorreu um erro. Tente novamente.'
    }
  } finally {
    loading.value = false
  }
}

// SEO
useHead({
  title: '+BET | Acesso ao Sistema',
  meta: [
    { name: 'description', content: 'Entre no +BET para gerenciar seus palpites e acompanhar o ranking.' }
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
