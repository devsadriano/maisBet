// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss'],
  app: {
    head: {
      htmlAttrs: {
        class: 'dark'
      }
    }
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
    typeCheck: false, // habilitar após setup inicial para não bloquear o dev
  },

  runtimeConfig: {
    // Chaves privadas — apenas server
    rapidApiKey: '',
    cronSecret: '',
    // Chaves públicas — expostas ao cliente
    public: {
      // Configurações públicas globais (se houver)
    },
  },
})
