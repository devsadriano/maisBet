/**
 * useTheme — Composable para controlar o tema Dark/Light do +BET
 *
 * - isDark: estado reativo (dark por padrão)
 * - toggleTheme: alterna e persiste no localStorage
 * - initTheme: chama no onMounted do layout para restaurar preferência
 */
export const useTheme = () => {
  const isDark = useState<boolean>('theme:isDark', () => true)

  const applyTheme = (dark: boolean) => {
    if (process.client) {
      document.documentElement.classList.toggle('dark', dark)
    }
  }

  const toggleTheme = () => {
    isDark.value = !isDark.value
    applyTheme(isDark.value)
    if (process.client) {
      localStorage.setItem('bet-theme', isDark.value ? 'dark' : 'light')
    }
  }

  const initTheme = () => {
    if (process.client) {
      const saved = localStorage.getItem('bet-theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      // dark é o padrão; só usa light se o usuário explicitamente salvou 'light'
      const dark = saved ? saved === 'dark' : true
      isDark.value = dark
      applyTheme(dark)
    }
  }

  return { isDark, toggleTheme, initTheme }
}
