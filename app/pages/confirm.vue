<template>
  <div class="min-h-screen bg-pitch-900 flex items-center justify-center p-4">
    <div class="text-center">

      <!-- Carregando -->
      <div v-if="status === 'loading'">
        <div class="w-16 h-16 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-6"></div>
        <h2 class="text-2xl font-bold text-white mb-2 font-bebas tracking-widest">Confirmando seu e-mail...</h2>
        <p class="text-gray-400">Aguarde um momento.</p>
      </div>

      <!-- Sucesso -->
      <div v-else-if="status === 'success'" class="animate-fade-in">
        <div class="text-5xl mb-4">✅</div>
        <h2 class="text-2xl font-bold text-white mb-2 font-bebas tracking-widest">E-mail verificado!</h2>
        <p class="text-gray-400">Redirecionando para o bolão...</p>
      </div>

      <!-- Erro -->
      <div v-else class="animate-fade-in">
        <div class="text-5xl mb-4">⚠️</div>
        <h2 class="text-xl font-bold text-white mb-2 font-bebas tracking-widest">Ops! A confirmação falhou.</h2>
        <p class="text-gray-400 mb-2">{{ errorDetail || 'O link pode ter expirado ou já foi usado.' }}</p>
        <button @click="goLogin" class="mt-6 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-all font-medium">
          Voltar para o Login
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorDetail = ref('')
const goLogin = () => router.replace('/login')

watch(user, (u) => {
  if (u?.sub && status.value === 'loading') {
    status.value = 'success'
    setTimeout(() => router.replace('/'), 800)
  }
}, { immediate: true })

onMounted(async () => {
  if (status.value !== 'loading') return

  const code = route.query.code as string | undefined
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      errorDetail.value = error.message
      status.value = 'error'
    } else {
      status.value = 'success'
      setTimeout(() => router.replace('/'), 800)
    }
  } else {
    setTimeout(() => {
      if (status.value === 'loading') {
        errorDetail.value = 'Nenhum código encontrado na URL.'
        status.value = 'error'
      }
    }, 3000)
  }
})
</script>
