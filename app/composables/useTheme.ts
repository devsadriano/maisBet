import { computed } from 'vue'
import { useState, useHead } from '#imports'

/**
 * useTheme — Composable para controlar o tema Dark/Light do +BET
 *
 * - isDark: estado reativo (dark por padrão)
 * - toggleTheme: alterna e persiste no localStorage
 * - initTheme: chama no onMounted do layout para restaurar preferência
 */
export const useTheme = () => {
  const isDark = useState<boolean>('theme:isDark', () => true)

  // Sincroniza a classe 'dark' no <html> de forma reativa e segura para evitar flickers de hidratação
  useHead({
    htmlAttrs: {
      class: computed(() => isDark.value ? 'dark' : 'light')
    }
  })

  const toggleTheme = () => {
    isDark.value = !isDark.value
    if (process.client) {
      localStorage.setItem('bet-theme', isDark.value ? 'dark' : 'light')
    }
  }

  const initTheme = () => {
    if (process.client) {
      const saved = localStorage.getItem('bet-theme')
      // dark é o padrão; só usa light se o usuário explicitamente salvou 'light'
      const dark = saved ? saved === 'dark' : true
      isDark.value = dark
    }
  }

  return { isDark, toggleTheme, initTheme }
}
