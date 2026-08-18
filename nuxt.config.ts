// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss', '@vite-pwa/nuxt'],

  app: {
    head: {
      htmlAttrs: {
        lang: 'pt-BR',
        class: 'dark'
      },
      meta: [
        { name: 'theme-color', content: '#1C1C1C' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: '+BET' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/img/icon-192.png' },
        { rel: 'apple-touch-icon', href: '/img/icon-192.png' }
      ]
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      id: '/',
      name: '+BET — Bolão de Futebol',
      short_name: '+BET',
      description: 'Seu hub de bolões de futebol. Palpite, compita e acompanhe o ranking!',
      lang: 'pt-BR',
      theme_color: '#1C1C1C',
      background_color: '#1C1C1C',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      categories: ['sports', 'games', 'entertainment'],
      icons: [
        {
          src: '/img/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/img/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/img/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/img/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-cache',
            networkTimeoutSeconds: 10,
          },
        },
      ],
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: false,
    },
  },

  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/login', '/confirm'],
    },
    types: '~/types/database.types.ts',
  },

  tailwindcss: {
    configPath: '~~/tailwind.config.ts',
    cssPath: '~/assets/css/main.css',
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  runtimeConfig: {
    rapidApiKey: '',
    cronSecret: '',
    public: {},
  },
})

