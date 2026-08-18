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
            {{ isLoginMode ? 'AUTENTICANDO' : 'PROCESSANDO SOLICITAÇÃO' }}
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

      <div class="relative z-10 text-center space-y-6 flex flex-col items-center">
        <!-- Logo oficial -->
        <img 
          src="/img/icon-512.png" 
          alt="+BET Logo" 
          class="w-36 h-36 rounded-[2.5rem] shadow-[0_0_40px_rgba(62,207,142,0.3)] border border-white/10 hover:scale-105 transition-transform duration-500 object-cover mb-4" 
        />
        <div class="flex items-center justify-center gap-4 opacity-80">
          <div class="h-px w-12 bg-white/30"></div>
          <p class="text-white font-bold text-xs tracking-[0.4em] uppercase shadow-sm">The Official Betting Hub</p>
          <div class="h-px w-12 bg-white/30"></div>
        </div>
      </div>
    </div>

    <!-- Right Side: Login Form -->
    <div class="w-full md:w-1/2 min-h-screen flex items-center justify-center p-4 md:p-6 relative">
      <!-- Mobile Blur Decor -->
      <div class="md:hidden absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-[var(--brand-glow)] rounded-full blur-[150px] pointer-events-none"></div>

      <div class="w-full max-w-[440px] relative z-10 space-y-4 md:space-y-10 py-4 md:py-0">
        <!-- Mobile Branding -->
        <div class="md:hidden text-center flex flex-col items-center justify-center space-y-2 mb-4 md:mb-10 mobile-branding">
          <img 
            src="/img/icon-192.png" 
            alt="+BET Logo" 
            class="w-20 h-20 rounded-2xl shadow-[0_0_25px_rgba(62,207,142,0.3)] border border-white/10 mb-2 object-cover" 
          />
        </div>

        <!-- Auth Card -->
        <BaseCard class="p-6 md:p-10 shadow-2xl bg-white dark:bg-[#161616] login-card">
          <!-- Cenário 2: Usuário Rejeitado -->
          <div v-if="profile?.status === 'rejeitado'" class="space-y-6 text-center">
            <div class="text-5xl mb-4">⚠️</div>
            <h2 class="text-2xl font-bebas text-[var(--text-primary)] tracking-widest text-red-500">SOLICITAÇÃO REJEITADA</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Sua solicitação de acesso ao sistema foi rejeitada pelo administrador.
            </p>
            <div v-if="rejectionReason" class="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-left">
              <p class="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Motivo informado:</p>
              <p class="text-xs text-red-600 dark:text-red-300 font-medium">{{ rejectionReason }}</p>
            </div>
            <BaseButton @click="logout" variant="brand" class="w-full py-4 text-xs tracking-[0.2em]">
              SAIR / SOLICITAR COM OUTRO E-MAIL
            </BaseButton>
          </div>

          <!-- Cenário 1: Solicitar Redefinição de Senha (isRecoveryMode) -->
          <div v-else-if="isRecoveryMode" class="space-y-4 md:space-y-6">
            <div class="mb-4 md:mb-8">
              <h2 class="text-2xl md:text-3xl font-bebas text-[var(--text-primary)] tracking-widest">
                RECUPERAR SENHA
              </h2>
              <p class="text-gray-500 dark:text-gray-400 text-xs mt-1 uppercase tracking-widest font-bold">
                Insira seu e-mail para receber o link de redefinição
              </p>
            </div>

            <form @submit.prevent="handleRequestRecovery" class="space-y-4 md:space-y-5">
              <div class="space-y-2 group">
                <label for="recovery-email" class="block text-[10px] font-black uppercase tracking-widest text-[var(--brand-light)] md:text-[var(--brand)] opacity-80 group-focus-within:opacity-100 transition-opacity">E-mail Cadastrado *</label>
                <input 
                  id="recovery-email"
                  v-model="recoveryEmail" 
                  type="email" 
                  required 
                  placeholder="seu@email.com"
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

              <BaseButton 
                type="submit" 
                variant="brand"
                class="w-full py-4 md:py-5 text-xl tracking-[0.2em]"
                :loading="loading"
              >
                ENVIAR E-MAIL DE RECUPERAÇÃO
              </BaseButton>
            </form>

            <div class="mt-6 md:mt-10 border-t border-black/5 dark:border-[var(--border)] pt-6 md:pt-8 text-center">
              <button 
                type="button"
                @click="isRecoveryMode = false; errorMsg = ''; successMsg = ''"
                class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-[var(--brand)] transition-colors focus:outline-none"
              >
                VOLTAR PARA O LOGIN
              </button>
            </div>
          </div>

          <!-- Cenário 1.2: Digitar o código OTP de 8 dígitos -->
          <div v-else-if="isOtpMode" class="space-y-4 md:space-y-6 animate-fade-in">
            <div class="mb-4 md:mb-8">
              <h2 class="text-2xl md:text-3xl font-bebas text-[var(--text-primary)] tracking-widest">
                VERIFICAR CÓDIGO
              </h2>
              <p class="text-gray-500 dark:text-gray-400 text-xs mt-1 uppercase tracking-widest font-bold">
                Digite o código de 8 dígitos enviado para seu e-mail
              </p>
            </div>

            <form @submit.prevent="handleVerifyOtp" class="space-y-4 md:space-y-5">
              <div class="space-y-2 group">
                <label for="otp-code" class="block text-[10px] font-black uppercase tracking-widest text-[var(--brand-light)] md:text-[var(--brand)] opacity-80 group-focus-within:opacity-100 transition-opacity">Código de 8 dígitos *</label>
                <input 
                  id="otp-code"
                  v-model="otpCode" 
                  type="text" 
                  required 
                  maxlength="8"
                  placeholder=""
                  class="w-full px-5 py-4 bg-gray-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl text-[var(--text-primary)] placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:bg-white dark:focus:bg-white/[0.07] transition-all duration-300 text-center font-bold text-xl otp-input-premium"
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

              <BaseButton 
                type="submit" 
                variant="brand"
                class="w-full py-4 md:py-5 text-xl tracking-[0.2em]"
                :loading="loading"
              >
                VERIFICAR CÓDIGO
              </BaseButton>
            </form>

            <div class="mt-6 md:mt-10 border-t border-black/5 dark:border-[var(--border)] pt-6 md:pt-8 text-center">
              <button 
                type="button"
                @click="isOtpMode = false; errorMsg = ''; successMsg = ''"
                class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-[var(--brand)] transition-colors focus:outline-none"
              >
                VOLTAR
              </button>
            </div>
          </div>

          <!-- Fluxo original de Login / Solicitar Acesso -->
          <div v-else>
            <div class="mb-8">
              <h2 class="text-3xl font-bebas text-[var(--text-primary)] tracking-widest">
                {{ isLoginMode ? 'ACESSAR CONTA' : 'SOLICITAR ACESSO' }}
              </h2>
              <p class="text-gray-500 dark:text-gray-400 text-xs mt-1 uppercase tracking-widest font-bold">
                {{ isLoginMode ? 'Inicie sua jornada no Brasileirão' : 'Preencha seus dados e aguarde aprovação' }}
              </p>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-5">
              <!-- Name Field (Solicitar) -->
              <div v-if="!isLoginMode" class="space-y-2 group">
                <label for="nome" class="block text-[10px] font-black uppercase tracking-widest text-[var(--brand-light)] md:text-[var(--brand)] opacity-80 group-focus-within:opacity-100 transition-opacity">Seu Nome Completo *</label>
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
                <label for="email" class="block text-[10px] font-black uppercase tracking-widest text-[var(--brand-light)] md:text-[var(--brand)] opacity-80 group-focus-within:opacity-100 transition-opacity">
                  {{ isLoginMode ? 'E-mail Autorizado' : 'Seu E-mail *' }}
                </label>
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
                <div class="flex justify-between items-center">
                  <label for="password" class="block text-[10px] font-black uppercase tracking-widest text-[var(--brand-light)] md:text-[var(--brand)] opacity-80 group-focus-within:opacity-100 transition-opacity">Sua Senha *</label>
                  <button 
                    v-if="isLoginMode"
                    type="button" 
                    @click="isRecoveryMode = true; errorMsg = ''; successMsg = ''; recoveryEmail = form.email"
                    class="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-[var(--brand)] transition-colors focus:outline-none"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
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

              <!-- Extra Fields (Solicitar only) -->
              <template v-if="!isLoginMode">
                <div class="space-y-2 group">
                  <label for="telefone" class="block text-[10px] font-black uppercase tracking-widest text-[var(--brand-light)] md:text-[var(--brand)] opacity-80 group-focus-within:opacity-100 transition-opacity">Telefone / WhatsApp</label>
                  <input 
                    id="telefone"
                    v-model="form.telefone" 
                    type="tel" 
                    placeholder="(00) 00000-0000"
                    class="w-full px-5 py-4 bg-gray-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl text-[var(--text-primary)] placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:bg-white dark:focus:bg-white/[0.07] transition-all duration-300"
                    :disabled="loading"
                  />
                </div>

                <div class="grid grid-cols-3 gap-4 group">
                  <div class="col-span-2 space-y-2">
                    <label for="cidade" class="block text-[10px] font-black uppercase tracking-widest text-[var(--brand-light)] md:text-[var(--brand)] opacity-80 group-focus-within:opacity-100 transition-opacity">Cidade</label>
                    <input 
                      id="cidade"
                      v-model="form.cidade" 
                      type="text" 
                      placeholder="Ex: São Paulo"
                      class="w-full px-5 py-4 bg-gray-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl text-[var(--text-primary)] placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:bg-white dark:focus:bg-white/[0.07] transition-all duration-300"
                      :disabled="loading"
                    />
                  </div>
                  <div class="col-span-1 space-y-2">
                    <label for="estado" class="block text-[10px] font-black uppercase tracking-widest text-[var(--brand-light)] md:text-[var(--brand)] opacity-80 group-focus-within:opacity-100 transition-opacity">UF</label>
                    <BaseSelect
                      id="estado"
                      v-model="form.estado"
                      :options="['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']"
                      placeholder="UF"
                      :disabled="loading"
                      variant="brand"
                      trigger-class="w-full flex items-center justify-between gap-2 px-5 py-4 bg-gray-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl cursor-pointer select-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div class="space-y-2 group">
                  <label for="mensagem" class="block text-[10px] font-black uppercase tracking-widest text-[var(--brand-light)] md:text-[var(--brand)] opacity-80 group-focus-within:opacity-100 transition-opacity">Mensagem (opcional)</label>
                  <textarea 
                    id="mensagem"
                    v-model="form.mensagem"
                    rows="3"
                    placeholder="Por que quer participar do bolão?"
                    class="w-full px-5 py-4 bg-gray-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl text-[var(--text-primary)] placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:bg-white dark:focus:bg-white/[0.07] transition-all duration-300 resize-none"
                    :disabled="loading"
                  ></textarea>
                </div>
              </template>

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
                {{ isLoginMode ? 'ENTRAR AGORA' : 'ENVIAR SOLICITAÇÃO' }}
              </BaseButton>
            </form>

            <!-- Toggle Mode -->
            <div class="mt-10 border-t border-black/5 dark:border-[var(--border)] pt-8 text-center">
              <button 
                type="button"
                @click="toggleMode"
                class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-[var(--brand)] transition-colors focus:outline-none"
              >
                {{ isLoginMode ? 'NÃO TEM CONTA? SOLICITE ACESSO' : 'JÁ POSSUI ACESSO? FAÇA LOGIN' }}
              </button>
            </div>
          </div>
        </BaseCard>

        <!-- Footer Info -->
        <div class="text-center px-8">
          <p class="text-[9px] text-gray-500 dark:text-gray-600 font-bold uppercase tracking-[0.4em] leading-loose">
            Acesso restrito a usuários autorizados do sistema de bolão dinâmico +BET. v4.1.0
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSelect from '~/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

definePageMeta({
  layout: false
})

const { login, register, user, profile, logout } = useAuth()
const supabase = useSupabaseClient()

const isLoginMode = ref(true)
const isRecoveryMode = ref(false)
const isOtpMode = ref(false)
const otpCode = ref('')
const recoveryEmail = ref('')
const rejectionReason = ref<string | null>(null)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const form = reactive({
  email: '',
  password: '',
  nome: '',
  telefone: '',
  cidade: '',
  estado: '',
  mensagem: ''
})

watch(() => form.telefone, (newVal) => {
  if (!newVal) return
  let v = newVal.replace(/\D/g, '').substring(0, 11)
  if (v.length > 2) {
    v = `(${v.substring(0, 2)}) ${v.substring(2)}`
  }
  if (v.length > 10) {
    v = `${v.substring(0, 10)}-${v.substring(10)}`
  }
  if (form.telefone !== v) {
    form.telefone = v
  }
})

watch(() => form.cidade, (newVal) => {
  if (!newVal) return
  const v = newVal.replace(/\b\w/g, l => l.toUpperCase())
  if (form.cidade !== v) {
    form.cidade = v
  }
})

watch(() => form.nome, (newVal) => {
  if (!newVal) return
  const v = newVal.replace(/\b\w/g, l => l.toUpperCase())
  if (form.nome !== v) {
    form.nome = v
  }
})

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  errorMsg.value = ''
  successMsg.value = ''
  form.password = ''
}

const fetchRejectionReason = async () => {
  if (!user.value) return
  const uid = user.value.id || (user.value as any).sub
  const { data } = await supabase
    .from('solicitacoes')
    .select('motivo_rejeicao')
    .eq('user_id', uid)
    .eq('tipo', 'acesso_sistema')
    .eq('status', 'rejeitada')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (data) {
    rejectionReason.value = data.motivo_rejeicao
  }
}

watch(() => profile.value?.status, (newStatus) => {
  if (newStatus === 'rejeitado') {
    fetchRejectionReason()
  }
}, { immediate: true })

const handleRequestRecovery = async () => {
  if (!recoveryEmail.value) {
    errorMsg.value = 'Por favor, insira o e-mail cadastrado.'
    return
  }
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail.value, {
      redirectTo: window.location.origin + '/confirm?type=recovery'
    })
    if (error) throw error
    successMsg.value = 'E-mail de recuperação enviado com sucesso!'
    setTimeout(() => {
      isRecoveryMode.value = false
      isOtpMode.value = true
      otpCode.value = ''
      successMsg.value = ''
      errorMsg.value = ''
    }, 1500)
  } catch (err: any) {
    const msg = err.message || ''
    if (msg.includes('once every 60 seconds') || msg.includes('rate limit')) {
      errorMsg.value = 'Por segurança, você só pode solicitar a recuperação uma vez a cada 60 segundos.'
    } else if (msg.includes('User not found') || msg.includes('user_not_found')) {
      errorMsg.value = 'Usuário não encontrado.'
    } else {
      errorMsg.value = msg || 'Erro ao enviar e-mail de recuperação.'
    }
  } finally {
    loading.value = false
  }
}

const handleVerifyOtp = async () => {
  if (!otpCode.value || otpCode.value.length !== 8) {
    errorMsg.value = 'O código deve conter exatamente 8 dígitos.'
    return
  }
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const { error } = await supabase.auth.verifyOtp({
      email: recoveryEmail.value,
      token: otpCode.value,
      type: 'recovery'
    })
    if (error) throw error
    successMsg.value = 'Código validado com sucesso! Redirecionando...'
    setTimeout(async () => {
      await navigateTo('/alterar-senha')
    }, 1200)
  } catch (err: any) {
    const msg = err.message || ''
    if (msg.includes('invalid') || msg.includes('expired') || msg.includes('Token')) {
      errorMsg.value = 'Código inválido ou expirado.'
    } else if (msg.includes('rate limit')) {
      errorMsg.value = 'Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.'
    } else {
      errorMsg.value = msg || 'Código inválido ou expirado.'
    }
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    if (isLoginMode.value) {
      // ── Login ────────────────────────────────
      await login(form.email, form.password)
      await navigateTo('/')
      
    } else {
      // ── Solicitar Acesso ─────────────────────
      if (form.password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres.')
      }

      // Chama a Edge Function no modo 'solicitar'
      const { data, error } = await supabase.functions.invoke('verificar-e-cadastrar', {
        body: {
          email: form.email,
          password: form.password,
          nome: form.nome,
          telefone: form.telefone || undefined,
          cidade: form.cidade || undefined,
          estado: form.estado || undefined,
          mensagem: form.mensagem || undefined,
          modo: 'solicitar'
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      // Sucesso: faz login automático e redireciona para área de espera
      await login(form.email, form.password)
      await navigateTo('/aguardando-aprovacao')
    }
    
  } catch (err: any) {
    const msg = err.message || ''
    if (msg.includes('Invalid login credentials')) {
      errorMsg.value = 'E-mail ou senha incorretos.'
    } else if (msg.includes('solicitação pendente')) {
      errorMsg.value = msg
    } else if (msg.includes('Já existe uma conta')) {
      errorMsg.value = msg
    } else if (msg.includes('rate limit')) {
      errorMsg.value = 'Muitas tentativas de login. Por favor, tente novamente mais tarde.'
    } else {
      errorMsg.value = msg || 'Ocorreu um erro. Tente novamente.'
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

.otp-input-premium {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 2.25rem !important; /* text-3xl */
  letter-spacing: 0.8ch !important;
  padding-left: 0.8ch !important; /* Compensa exatamente o letter-spacing final do último caractere */
  padding-right: 0px !important;
  text-indent: 0px !important;
  background-image: repeating-linear-gradient(
    90deg, 
    rgba(128, 128, 128, 0.3) 0, 
    rgba(128, 128, 128, 0.3) 1ch, 
    transparent 0, 
    transparent 1.8ch
  ) !important;
  background-position: bottom 14px center !important;
  background-size: 13.6ch 2px !important; /* 8 caracteres (8ch) + 7 espaços (5.6ch) = 13.6ch */
  background-repeat: no-repeat !important;
}

.otp-input-premium:focus {
  background-image: repeating-linear-gradient(
    90deg, 
    #10b981 0, 
    #10b981 1ch, 
    transparent 0, 
    transparent 1.8ch
  ) !important;
}

@media (max-width: 640px) {
  .otp-input-premium {
    font-size: 1.45rem !important;
    letter-spacing: 0.5ch !important;
    padding-left: 0.5ch !important;
    background-image: repeating-linear-gradient(
      90deg, 
      rgba(128, 128, 128, 0.3) 0, 
      rgba(128, 128, 128, 0.3) 1ch, 
      transparent 0, 
      transparent 1.5ch
    ) !important;
    background-size: 11.5ch 2px !important; /* 8 * 1ch + 7 * 0.5ch = 11.5ch */
  }
  .otp-input-premium:focus {
    background-image: repeating-linear-gradient(
      90deg, 
      #10b981 0, 
      #10b981 1ch, 
      transparent 0, 
      transparent 1.5ch
    ) !important;
  }
}

/* Responsividade para telas curtas (ex: iPhone SE, Galaxy S8+, etc.) */
@media (max-height: 740px) {
  .mobile-branding {
    margin-bottom: 0.5rem !important;
    margin-top: 0px !important;
  }
  .mobile-branding h1 {
    font-size: 1.75rem !important;
  }
  .mobile-branding .w-12 {
    width: 2rem !important;
    height: 2rem !important;
    border-radius: 0.75rem !important;
  }
  .mobile-branding span {
    font-size: 1.25rem !important;
  }

  .login-card {
    padding: 1.25rem !important;
  }

  .login-card h2 {
    font-size: 1.5rem !important;
  }
  
  .login-card p {
    font-size: 0.7rem !important;
  }

  /* Reduz margens de cabeçalho do card */
  .mb-8, .mb-4 {
    margin-bottom: 0.5rem !important;
  }

  /* Reduz o espaço entre os elementos do form */
  .space-y-5 > :not([hidden]) ~ :not([hidden]),
  .space-y-4 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 0.65rem !important;
  }

  /* Reduz os inputs */
  input {
    padding-top: 0.65rem !important;
    padding-bottom: 0.65rem !important;
    font-size: 0.875rem !important;
    border-radius: 0.75rem !important;
  }

  /* Ajusta o input OTP específico para caber verticalmente e horizontalmente */
  .otp-input-premium {
    font-size: 1.35rem !important;
    letter-spacing: 0.45ch !important;
    padding-left: 0.45ch !important;
    background-size: 11.15ch 2px !important; /* 8 * 1 + 7 * 0.45 = 11.15ch */
    background-position: bottom 10px center !important;
  }
  .otp-input-premium:focus {
    background-image: repeating-linear-gradient(
      90deg, 
      #10b981 0, 
      #10b981 1ch, 
      transparent 0, 
      transparent 1.45ch
    ) !important;
  }

  /* Reduz botões de envio */
  button[type="submit"], .py-5, .py-4 {
    padding-top: 0.75rem !important;
    padding-bottom: 0.75rem !important;
    font-size: 1rem !important;
  }

  /* Reduz espaçamento do rodapé */
  .mt-10, .mt-6 {
    margin-top: 0.75rem !important;
    padding-top: 0.5rem !important;
  }

  .px-8 {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
  }
  
  .px-8 p {
    line-height: 1.2 !important;
  }
}

/* Responsividade extrema para telas muito curtas (ex: abaixo de 600px de altura) */
@media (max-height: 600px) {
  .mobile-branding {
    display: none !important; /* Esconde o logo para priorizar totalmente o formulário */
  }
  .login-card {
    padding: 1rem !important;
  }
}
</style>
