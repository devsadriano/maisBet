// app/composables/useToast.ts
import { useState } from '#app'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

let _nextId = 0

export const useToast = () => {
  const toasts = useState<Toast[]>('toasts', () => [])

  const show = (message: string, type: ToastType = 'info', durationMs = 4000) => {
    const id = ++_nextId
    toasts.value.push({ id, message, type })

    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, durationMs)
  }

  const success = (message: string) => show(message, 'success')
  const error = (message: string) => show(message, 'error')
  const info = (message: string) => show(message, 'info')

  const dismiss = (id: number) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, success, error, info, dismiss }
}
