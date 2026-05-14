export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isAdmin, waitForProfile } = useAuth()
  
  // Aguarda o perfil carregar antes de verificar permissões
  await waitForProfile()

  // Se não for admin, volta para a home
  if (!isAdmin.value) {
    return navigateTo('/')
  }
})
