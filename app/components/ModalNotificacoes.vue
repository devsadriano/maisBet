<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
        @click.self="$emit('close')"
      >
        <div
          class="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] transition-colors"
          :class="isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-black/10 text-gray-900'"
        >
          <!-- Header -->
          <div
            class="px-6 py-5 border-b flex items-center justify-between shrink-0"
            :class="isDark ? 'border-white/10 bg-white/[0.02]' : 'border-black/5 bg-gray-50'"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-[var(--brand-dim)] border border-[var(--brand)]/30 flex items-center justify-center text-xl">
                🔔
              </div>
              <div>
                <h2 class="text-2xl font-bebas tracking-wider leading-none">Notificações</h2>
                <p class="text-[11px] font-bold uppercase tracking-wider mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  Histórico e alertas push do +BET
                </p>
              </div>
            </div>
            <button
              @click="$emit('close')"
              class="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              :class="isDark ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10' : 'bg-black/5 text-gray-500 hover:text-gray-900 hover:bg-black/10'"
              aria-label="Fechar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Abas -->
          <div
            class="px-6 pt-3 pb-3 border-b grid grid-cols-2 gap-2 shrink-0"
            :class="isDark ? 'border-white/10 bg-white/[0.01]' : 'border-black/5 bg-gray-50/70'"
          >
            <button
              @click="activeTab = 'recentes'"
              class="py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              :class="activeTab === 'recentes'
                ? 'bg-[var(--brand)] text-white shadow-md'
                : (isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-black/5 text-gray-600 hover:text-gray-900')"
            >
              <span>📬 Recentes</span>
              <span
                v-if="unreadCount > 0"
                class="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center"
                :class="activeTab === 'recentes' ? 'bg-white text-[var(--brand)]' : 'bg-red-500 text-white'"
              >
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>
            </button>
            <button
              @click="activeTab = 'config'"
              class="py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              :class="activeTab === 'config'
                ? 'bg-[var(--brand)] text-white shadow-md'
                : (isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-black/5 text-gray-600 hover:text-gray-900')"
            >
              <span>⚙️ Configurar Push</span>
              <span
                v-if="!isSubscribed"
                class="w-2 h-2 rounded-full bg-amber-400"
              ></span>
            </button>
          </div>

          <!-- ABA 1: ÚLTIMAS NOTIFICAÇÕES -->
          <div v-if="activeTab === 'recentes'" class="p-5 space-y-3 overflow-y-auto flex-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] font-black uppercase tracking-[0.2em]" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                {{ unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Últimas notificações' }}
              </span>
              <button
                v-if="unreadCount > 0"
                @click="markAllAsRead"
                class="text-[11px] font-bold text-[var(--brand)] hover:underline"
              >
                Marcar todas como lidas
              </button>
            </div>

            <div v-if="loadingNotifications && notifications.length === 0" class="py-12 flex flex-col items-center justify-center gap-3">
              <div class="w-8 h-8 border-4 border-[var(--brand)]/20 border-t-[var(--brand)] rounded-full animate-spin"></div>
              <span class="text-xs font-bold uppercase tracking-wider" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                Carregando notificações...
              </span>
            </div>

            <div v-else-if="notifications.length === 0" class="py-12 text-center space-y-2">
              <span class="text-4xl block opacity-60">📭</span>
              <p class="text-sm font-bold">Nenhuma notificação por enquanto</p>
              <p class="text-xs max-w-xs mx-auto" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                Quando houver convocação de organizador, abertura de rodada, cravadas ou fechamentos, tudo ficará salvo aqui.
              </p>
            </div>

            <div v-else class="space-y-2">
              <button
                v-for="item in notifications"
                :key="item.id"
                @click="openNotification(item)"
                class="w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 group"
                :class="!item.read_at
                  ? (isDark ? 'border-[var(--brand)]/40 bg-[var(--brand)]/10 hover:bg-[var(--brand)]/15' : 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15')
                  : (isDark ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]' : 'border-black/5 bg-gray-50 hover:bg-gray-100')"
              >
                <span
                  class="mt-1.5 w-2 h-2 rounded-full shrink-0"
                  :class="!item.read_at ? 'bg-[var(--brand)]' : 'bg-transparent'"
                ></span>
                <div class="min-w-0 flex-1 space-y-1">
                  <div class="flex items-start justify-between gap-2">
                    <span class="text-xs font-extrabold leading-snug">{{ item.title }}</span>
                    <span class="text-[10px] font-mono shrink-0" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                      {{ formatRelativeTime(item.created_at) }}
                    </span>
                  </div>
                  <p class="text-xs leading-relaxed" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                    {{ item.message }}
                  </p>
                </div>
              </button>
            </div>
          </div>

          <!-- ABA 2: CONFIGURAR PUSH -->
          <div v-else class="p-6 space-y-5 overflow-y-auto flex-1">
            <!-- Aviso iOS fora da Tela de Início -->
            <div
              v-if="needsIosInstall"
              class="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs space-y-1.5"
            >
              <p class="font-black uppercase tracking-wider text-amber-400">📱 Dica para iPhone / iPad</p>
              <p :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                No iOS, notificações push funcionam apenas com o app instalado na Tela de Início: toque em
                <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
              </p>
            </div>

            <!-- Aviso navegador sem suporte -->
            <div
              v-else-if="!isSupported"
              class="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-xs space-y-1"
            >
              <p class="font-black uppercase tracking-wider text-red-400">Navegador incompatível</p>
              <p :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                Este navegador ou modo de navegação não suporta notificações Web Push. Use Chrome, Edge, Firefox ou Safari instalado como app.
              </p>
            </div>

            <!-- Aviso permissão negada -->
            <div
              v-else-if="permission === 'denied'"
              class="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-xs space-y-1"
            >
              <p class="font-black uppercase tracking-wider text-red-400">🚫 Permissão Bloqueada</p>
              <p :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                Você bloqueou as notificações neste navegador. Clique no ícone de cadeado/configurações na barra de endereço e mude <strong>Notificações</strong> para <strong>Permitir</strong>.
              </p>
            </div>

            <!-- Card Principal: Ativar / Desativar neste aparelho -->
            <div
              class="p-4 rounded-2xl border flex items-center justify-between gap-4"
              :class="isSubscribed
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : (isDark ? 'border-white/10 bg-white/[0.03]' : 'border-black/10 bg-gray-50')"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span
                    class="w-2.5 h-2.5 rounded-full shrink-0"
                    :class="isSubscribed ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'"
                  ></span>
                  <span class="font-bold text-sm">
                    {{ isSubscribed ? 'Notificações Ativas neste Aparelho' : 'Notificações Desativadas aqui' }}
                  </span>
                </div>
                <p class="text-xs mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
                  {{
                    activeDevices > 0
                      ? `${activeDevices} aparelho(s) conectado(s) na sua conta.`
                      : 'Ative para receber alertas mesmo com o site fechado.'
                  }}
                </p>
              </div>

              <button
                @click="toggleSubscription"
                :disabled="loading || !isSupported || permission === 'denied'"
                class="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                :class="isSubscribed
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                  : 'bg-[var(--brand)] text-white shadow-lg hover:brightness-110'"
              >
                {{ loading ? 'Aguarde...' : (isSubscribed ? 'Desativar' : 'Ativar Agora') }}
              </button>
            </div>

            <!-- Erro -->
            <div v-if="errorMessage" class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium">
              {{ errorMessage }}
            </div>

            <!-- Preferências por Categoria -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black uppercase tracking-[0.2em]" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  Tipos de Alertas
                </span>
                <label class="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="preferences.push_enabled"
                    @change="onTogglePref('push_enabled', ($event.target as HTMLInputElement).checked)"
                    class="rounded accent-[var(--brand)] w-4 h-4 cursor-pointer"
                  />
                  <span>Receber Push Geral</span>
                </label>
              </div>

              <div class="space-y-2" :class="!preferences.push_enabled ? 'opacity-50 pointer-events-none' : ''">
                <label
                  v-for="item in prefItems"
                  :key="item.key"
                  class="flex items-start justify-between gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors"
                  :class="isDark ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]' : 'border-black/5 bg-gray-50 hover:bg-gray-100'"
                >
                  <div class="min-w-0">
                    <div class="font-bold text-xs flex items-center gap-1.5">
                      <span>{{ item.icon }}</span>
                      <span>{{ item.title }}</span>
                    </div>
                    <p class="text-[11px] mt-0.5 leading-snug" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
                      {{ item.description }}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    :checked="Boolean(preferences[item.key])"
                    @change="onTogglePref(item.key, ($event.target as HTMLInputElement).checked)"
                    class="mt-0.5 rounded accent-[var(--brand)] w-4 h-4 shrink-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="px-6 py-4 border-t flex items-center justify-between gap-3 shrink-0"
            :class="isDark ? 'border-white/10 bg-white/[0.02]' : 'border-black/5 bg-gray-50'"
          >
            <button
              v-if="activeTab === 'config'"
              @click="handleTest"
              :disabled="!isSubscribed || testing"
              class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              :class="isDark
                ? 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10'
                : 'bg-white border-black/10 text-gray-700 hover:bg-gray-100'"
            >
              {{ testing ? 'Enviando...' : '🔔 Testar Notificação' }}
            </button>
            <button
              v-else
              @click="fetchNotifications"
              class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all"
              :class="isDark
                ? 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10'
                : 'bg-white border-black/10 text-gray-700 hover:bg-gray-100'"
            >
              ↻ Atualizar
            </button>

            <button
              @click="$emit('close')"
              class="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[var(--brand)] text-white hover:brightness-110 transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePushNotifications } from '~/composables/usePushNotifications'
import { useToast } from '~/composables/useToast'
import type { NotificationPreferences, UserNotification } from '~~/shared/types/PushNotification'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits(['close'])

const { isDark } = useTheme()
const toast = useToast()
const router = useRouter()

const {
  isSupported,
  needsIosInstall,
  permission,
  isSubscribed,
  activeDevices,
  loading,
  testing,
  errorMessage,
  preferences,
  notifications,
  unreadCount,
  loadingNotifications,
  initPushState,
  fetchPreferences,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  subscribe,
  unsubscribe,
  updatePreferences,
  sendTestNotification,
} = usePushNotifications()

const activeTab = ref<'recentes' | 'config'>('recentes')

type PrefBooleanKey = keyof Pick<
  NotificationPreferences,
  'push_enabled' | 'organizer_alerts' | 'round_alerts' | 'deadline_reminders' | 'results_alerts'
>

const prefItems: Array<{ key: PrefBooleanKey; icon: string; title: string; description: string }> = [
  {
    key: 'organizer_alerts',
    icon: '👑',
    title: 'Alertas de Organizador',
    description: 'Convocação da rodada e lembretes de 12h, 6h e 1h para escolher os jogos extras.',
  },
  {
    key: 'round_alerts',
    icon: '⚽',
    title: 'Abertura, Calendário e Palpites Revelados',
    description: 'Rodada aberta, mudanças de horário da CBF e aviso quando o mercado fecha e revela os palpites.',
  },
  {
    key: 'deadline_reminders',
    icon: '⏰',
    title: 'Lembretes Anti-Esquecimento (12h / 6h / 1h)',
    description: 'Enviado somente se você ainda tiver jogos sem palpite na rodada.',
  },
  {
    key: 'results_alerts',
    icon: '🎯',
    title: 'Cravadas e Fechamento da Rodada',
    description: 'Alerta instantâneo de placar exato ("Na Mosca!") e resumo da sua pontuação e posição ao fim da rodada.',
  },
]

watch(
  () => props.open,
  async (val) => {
    if (val) {
      await initPushState()
      await Promise.all([fetchPreferences(), fetchNotifications()])
      activeTab.value = unreadCount.value > 0 || isSubscribed.value ? 'recentes' : 'config'
    }
  }
)

const formatRelativeTime = (iso: string) => {
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diffSec < 60) return 'agora'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `há ${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `há ${diffHours}h`
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const openNotification = async (item: UserNotification) => {
  if (!item.read_at) {
    await markAsRead(item.id)
  }
  emit('close')
  await router.push(item.url || '/palpites')
}

const toggleSubscription = async () => {
  if (isSubscribed.value) {
    const res = await unsubscribe()
    if (res.success) {
      toast.info('Notificações desativadas neste aparelho.')
    } else if (res.message) {
      toast.error(res.message)
    }
    return
  }

  const res = await subscribe()
  if (res.success) {
    toast.success('🔔 Notificações ativadas com sucesso!')
  } else if (res.message) {
    toast.error(res.message)
  }
}

const onTogglePref = async (key: PrefBooleanKey, value: boolean) => {
  const ok = await updatePreferences({ [key]: value })
  if (ok) {
    toast.success('Preferências atualizadas!')
  } else {
    toast.error('Erro ao salvar preferências.')
  }
}

const handleTest = async () => {
  const res = await sendTestNotification()
  if (res.success) {
    toast.success('Push de teste enviado! Confira sua barra de notificações.')
  } else if (res.message) {
    toast.error(res.message)
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
