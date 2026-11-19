import { useRuntimeConfig, useState } from '#imports'
import type { NotificationPreferences } from '~~/shared/types/PushNotification'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function getOrRegisterServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/')
  if (existing) {
    return existing
  }

  try {
    const swRes = await fetch('/sw.js', { method: 'HEAD' })
    const contentType = swRes.headers.get('content-type') || ''
    if (swRes.ok && contentType.includes('javascript')) {
      return await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    }
  } catch {
    // Em dev sem Workbox, cai para /push-sw.js
  }

  return await navigator.serviceWorker.register('/push-sw.js', { scope: '/' })
}

async function waitForActiveRegistration(reg: ServiceWorkerRegistration): Promise<ServiceWorkerRegistration> {
  if (reg.active) return reg
  const ready = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<ServiceWorkerRegistration>((resolve) => setTimeout(() => resolve(reg), 2500)),
  ])
  return ready
}

export const usePushNotifications = () => {
  const config = useRuntimeConfig()

  const isSupported = useState<boolean>('push-supported', () => false)
  const needsIosInstall = useState<boolean>('push-ios-install', () => false)
  const permission = useState<NotificationPermission>('push-permission', () => 'default')
  const isSubscribed = useState<boolean>('push-subscribed', () => false)
  const activeDevices = useState<number>('push-active-devices', () => 0)
  const loading = useState<boolean>('push-loading', () => false)
  const testing = useState<boolean>('push-testing', () => false)
  const errorMessage = useState<string | null>('push-error', () => null)
  const initialized = useState<boolean>('push-initialized', () => false)

  const preferences = useState<NotificationPreferences>('push-preferences', () => ({
    user_id: '',
    push_enabled: true,
    organizer_alerts: true,
    round_alerts: true,
    deadline_reminders: true,
    results_alerts: true,
  }))

  const refreshState = async () => {
    if (!import.meta.client) return

    const ua = navigator.userAgent || ''
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true

    needsIosInstall.value = isIOS && !isStandalone

    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    isSupported.value = supported
    if (!supported) {
      isSubscribed.value = false
      return
    }

    permission.value = Notification.permission

    try {
      const reg = await navigator.serviceWorker.getRegistration('/')
      if (reg) {
        const sub = await reg.pushManager.getSubscription()
        isSubscribed.value = Boolean(sub)
      } else {
        isSubscribed.value = false
      }
    } catch {
      isSubscribed.value = false
    }
  }

  const fetchPreferences = async () => {
    if (!import.meta.client) return
    try {
      const res = await $fetch<{ preferences: NotificationPreferences; activeDevices: number }>(
        '/api/push/preferences'
      )
      if (res?.preferences) {
        preferences.value = res.preferences
      }
      activeDevices.value = res?.activeDevices ?? 0
    } catch {
      // Silencioso quando deslogado
    }
  }

  const initPushState = async () => {
    if (!import.meta.client) return
    await refreshState()
    if (!initialized.value) {
      initialized.value = true
      await fetchPreferences()
    }
  }

  const subscribe = async (): Promise<{ success: boolean; message?: string }> => {
    if (!import.meta.client) return { success: false, message: 'Disponível apenas no navegador.' }

    errorMessage.value = null
    if (!isSupported.value) {
      const msg = needsIosInstall.value
        ? 'No iPhone/iPad, adicione o +BET à Tela de Início (Compartilhar → Adicionar à Tela de Início) para ativar notificações.'
        : 'Este navegador não suporta notificações Web Push.'
      errorMessage.value = msg
      return { success: false, message: msg }
    }

    const vapidPublicKey = (config.public?.vapidPublicKey as string) || ''
    if (!vapidPublicKey) {
      const msg = 'Chave pública VAPID não configurada no servidor.'
      errorMessage.value = msg
      return { success: false, message: msg }
    }

    loading.value = true
    try {
      const permResult = await Notification.requestPermission()
      permission.value = permResult

      if (permResult === 'denied') {
        const msg = 'Permissão negada no navegador. Libere as notificações nas configurações do site e tente novamente.'
        errorMessage.value = msg
        return { success: false, message: msg }
      }

      if (permResult !== 'granted') {
        const msg = 'Você fechou o pedido de permissão antes de confirmar.'
        errorMessage.value = msg
        return { success: false, message: msg }
      }

      const rawReg = await getOrRegisterServiceWorker()
      const reg = await waitForActiveRegistration(rawReg)

      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })
      }

      const subJson = sub.toJSON()
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error('Falha ao obter chaves criptográficas do navegador.')
      }

      await $fetch('/api/push/subscribe', {
        method: 'POST',
        body: {
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
        },
      })

      isSubscribed.value = true
      await fetchPreferences()
      return { success: true }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Não foi possível ativar as notificações neste aparelho.'
      errorMessage.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  const unsubscribe = async (): Promise<{ success: boolean; message?: string }> => {
    if (!import.meta.client) return { success: false }
    errorMessage.value = null
    loading.value = true

    try {
      const reg = await navigator.serviceWorker.getRegistration('/')
      const sub = reg ? await reg.pushManager.getSubscription() : null

      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        await $fetch('/api/push/unsubscribe', {
          method: 'POST',
          body: { endpoint },
        }).catch(() => {})
      }

      isSubscribed.value = false
      await fetchPreferences()
      return { success: true }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Erro ao desativar notificações neste aparelho.'
      errorMessage.value = msg
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  const updatePreferences = async (patch: Partial<NotificationPreferences>): Promise<boolean> => {
    errorMessage.value = null
    const next = { ...preferences.value, ...patch }
    preferences.value = next

    try {
      const res = await $fetch<{ success: boolean; preferences: NotificationPreferences }>(
        '/api/push/preferences',
        {
          method: 'PUT',
          body: next,
        }
      )
      if (res?.preferences) {
        preferences.value = res.preferences
      }
      return true
    } catch (err: any) {
      errorMessage.value = err?.data?.message || 'Erro ao salvar preferências.'
      await fetchPreferences()
      return false
    }
  }

  const sendTestNotification = async (): Promise<{ success: boolean; message?: string }> => {
    errorMessage.value = null
    testing.value = true
    try {
      await $fetch('/api/push/test', { method: 'POST' })
      return { success: true }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Falha ao enviar notificação de teste.'
      errorMessage.value = msg
      return { success: false, message: msg }
    } finally {
      testing.value = false
    }
  }

  return {
    isSupported,
    needsIosInstall,
    permission,
    isSubscribed,
    activeDevices,
    loading,
    testing,
    errorMessage,
    preferences,
    initPushState,
    refreshState,
    fetchPreferences,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
  }
}
