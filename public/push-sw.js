/* eslint-disable no-undef */
// Service Worker script para Web Push Notifications no +BET
// Importado automaticamente pelo Workbox (@vite-pwa/nuxt) e registrado como fallback em dev.

self.addEventListener('push', (event) => {
  let payload = {
    title: '+BET',
    message: 'Nova atualização no seu bolão!',
    url: '/palpites',
    icon: '/img/icon-192.png',
    badge: '/img/icon-192.png',
    tag: undefined,
  }

  if (event.data) {
    try {
      const parsed = event.data.json()
      payload = {
        ...payload,
        ...parsed,
        message: parsed.message || parsed.body || payload.message,
      }
    } catch {
      const text = event.data.text()
      if (text) {
        payload.message = text
      }
    }
  }

  const options = {
    body: payload.message,
    icon: payload.icon || '/img/icon-192.png',
    badge: payload.badge || '/img/icon-192.png',
    tag: payload.tag || undefined,
    renotify: Boolean(payload.tag),
    vibrate: [150, 80, 150],
    data: {
      url: payload.url || '/palpites',
    },
  }

  event.waitUntil(self.registration.showNotification(payload.title || '+BET', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const rawUrl = (event.notification.data && event.notification.data.url) || '/palpites'
  const targetUrl = new URL(rawUrl, self.location.origin).href

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin)) {
            return client.focus().then((focusedClient) => {
              const targetClient = focusedClient || client
              if ('navigate' in targetClient && targetClient.url !== targetUrl) {
                return targetClient.navigate(targetUrl).catch(() => undefined)
              }
              return targetClient
            })
          }
        }
        return self.clients.openWindow(targetUrl)
      })
  )
})
