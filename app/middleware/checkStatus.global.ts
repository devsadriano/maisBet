export default defineNuxtRouteMiddleware(async (to) => {
  const { user, userStatus, waitForProfile } = useAuth()

  // Páginas públicas que não precisam de verificação
  const publicPaths = ['/login', '/confirm']
  if (publicPaths.includes(to.path)) return

  // Se não está logado, não interfere
  if (!user.value) return

  // ── SEGURANÇA CRÍTICA ──
  // Aguarda o perfil carregar do banco ANTES de tomar qualquer decisão.
  // Isso evita tanto bloquear admins quanto liberar pendentes prematuramente.
  await waitForProfile()

  const status = userStatus.value

  // Páginas que usuários pendentes PODEM acessar
  const allowedForPending = ['/aguardando-aprovacao', '/login', '/regras']

  if (status === 'pendente') {
    if (!allowedForPending.includes(to.path)) {
      return navigateTo('/aguardando-aprovacao')
    }
  }

  if (status === 'rejeitado') {
    if (to.path !== '/login') {
      return navigateTo('/login')
    }
  }

  // Usuário ativo que tenta acessar a área de espera → redireciona ao lobby
  if (status === 'ativo' && to.path === '/aguardando-aprovacao') {
    return navigateTo('/')
  }
})
