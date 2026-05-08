export default defineNuxtRouteMiddleware((to) => {
  const { user, userStatus } = useAuth()

  // Só roda se o usuário estiver logado
  if (!user.value) return

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
